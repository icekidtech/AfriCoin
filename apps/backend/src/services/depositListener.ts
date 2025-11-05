import { ethers } from 'ethers';
import { WalletService } from './walletService';
import { CONTRACTS, AFRICOIN_ABI, CURRENCY_PAIRS } from '../config/contracts';
import { fxConverterService } from './fxConverterService';

export class DepositListener {
  private provider: ethers.Provider;
  private contract: ethers.Contract;
  private walletService: WalletService;
  private mockOracleContract: ethers.Contract;
  private pollingInterval: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private maxRetries = 3;
  private baseDelay = 30000; // 30 seconds, more conservative

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL as string);
    
    this.contract = new ethers.Contract(
      CONTRACTS.afriCoin.address,
      AFRICOIN_ABI,
      this.provider
    );

    // Initialize MockOracle contract
    const MOCK_ORACLE_ABI = [
      {
        inputs: [{ internalType: 'bytes32', name: 'pair', type: 'bytes32' }],
        name: 'getLatestPrice',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ];

    this.mockOracleContract = new ethers.Contract(
      CONTRACTS.mockOracle.address,
      MOCK_ORACLE_ABI,
      this.provider
    );

    this.walletService = new WalletService();
  }

  async startListening() {
    console.log('🚀 Starting Deposit event listener...');

    // Poll for events instead of using filters
    const startBlock = await this.provider.getBlockNumber();
    let lastBlock = startBlock;

    this.pollingInterval = setInterval(async () => {
      try {
        const currentBlock = await this.provider.getBlockNumber();
        
        if (currentBlock > lastBlock) {
          // Reset retry count on successful poll
          this.retryCount = 0;

          const events = await this.contract.queryFilter(
            this.contract.filters.Deposit(),
            lastBlock + 1,
            currentBlock
          );

          for (const event of events) {
            // Cast event to EventLog to access 'args'
            const eventLog = event as ethers.EventLog;
            const user = eventLog.args?.[0];
            const ethAmount = eventLog.args?.[1];
            
            console.log(`📥 Deposit detected: ${user} sent ${ethers.formatEther(ethAmount)} ETH`);

            try {
              const ethAfriPriceWei = await this.getEthAfriPrice();
              const afriAmount = (ethAmount * ethAfriPriceWei) / ethers.parseEther('1');
              
              const result = await this.walletService.fundUserWithAfriCoin(
                user,
                ethers.formatEther(afriAmount)
              );

              console.log(`✅ Minted ${ethers.formatEther(afriAmount)} AFRI to ${user}. TX: ${result.txHash}`);
            } catch (error) {
              console.error('❌ Failed to process deposit:', error);
            }
          }

          lastBlock = currentBlock;
        }
      } catch (error) {
        this.retryCount++;
        const delay = this.baseDelay * Math.pow(2, this.retryCount - 1); // Exponential backoff
        
        console.error(`❌ Polling error (attempt ${this.retryCount}/${this.maxRetries}):`, error);
        
        if (this.retryCount >= this.maxRetries) {
          console.error('❌ Max retries reached. Stopping listener.');
          this.stopListening();
        } else {
          console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
        }
      }
    }, this.baseDelay);
  }

  private async getEthAfriPrice(): Promise<bigint> {
    try {
      // Get ETH/USD price first
      const ethUsdPairBytes32 = ethers.id('ETH/USD');
      console.log(`🔍 Fetching ETH/USD price from MockOracle...`);
      
      const ethUsdPrice = await this.mockOracleContract.getLatestPrice(ethUsdPairBytes32);
      console.log(`✅ ETH/USD price: ${ethers.formatEther(ethUsdPrice)}`);
      
      // Get USD/AFRI conversion rate
      const usdAfriPairBytes32 = ethers.id('USD/AFRI');
      const usdAfriRate = await this.mockOracleContract.getLatestPrice(usdAfriPairBytes32);
      console.log(`✅ USD/AFRI rate: ${ethers.formatEther(usdAfriRate)} AFRI per USD`);
      
      // Calculate: 1 ETH = (ETH/USD price) * (USD/AFRI rate) AFRI
      // Both prices are in wei (18 decimals)
      // Formula: (ethUsdPrice * usdAfriRate) / 10^18
      const oneEther = ethers.parseEther('1');
      const ethAfriPrice = (ethUsdPrice * usdAfriRate) / oneEther;
      
      console.log(`✅ Calculated ETH/AFRI price: ${ethers.formatEther(ethAfriPrice)} AFRI/ETH`);
      
      return ethAfriPrice;
    } catch (error) {
      console.error('❌ Error fetching price from MockOracle:', error);
      
      // Fallback: 1 ETH = $2,500 * 10,000 AFRI/USD = 25M AFRI
      console.error('❌ Using fallback calculation');
      return ethers.parseEther('25000000');
    }
  }

  /**
   * Stop listening to Deposit events
   */
  stopListening() {
    console.log('🛑 Stopping Deposit event listener...');
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.contract.removeAllListeners('Deposit');
  }
}

// Usage: In your main backend file, e.g., index.ts
// const listener = new DepositListener();
// listener.startListening();
// 
// To stop listening:
// listener.stopListening();


// In production, use a dedicated indexing service like The Graph for production, but polling is simpler for development.