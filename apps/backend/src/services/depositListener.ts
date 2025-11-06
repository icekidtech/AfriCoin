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
      const oneEther = BigInt(10 ** 18);
      const ethAfriPrice = (BigInt(Math.floor(ethUsdPrice * usdAfriRate * Number(oneEther)))) / oneEther;

      console.log(`✅ Calculated ETH/AFRI price: ${ethers.formatEther(ethAfriPrice)} AFRI/ETH`);
      
      return ethAfriPrice;
    } catch (error) {
      console.error('❌ Error fetching price from MockOracle:', error);
      
      // Fallback: 1 ETH = $2,500 * 10,000 AFRI/USD = 25M AFRI
      console.error('❌ Using fallback calculation');
      return ethers.parseEther('25000000');
    }
  }

  async startListening() {
    console.log('🚀 Starting Deposit event listener...');

    const startBlock = await this.provider.getBlockNumber();
    let lastBlock = startBlock;

    this.pollingInterval = setInterval(async () => {
      try {
        const currentBlock = await this.provider.getBlockNumber();
        
        if (currentBlock > lastBlock) {
          this.retryCount = 0;

          const events = await this.contract.queryFilter(
            this.contract.filters.Deposit(),
            lastBlock + 1,
            currentBlock
          );

          for (const event of events) {
            if ('args' in event && Array.isArray(event.args)) {
              const depositorAddress = event.args[0];
              const ethAmount = event.args[1];
              
              console.log(`📥 Deposit detected: ${depositorAddress} sent ${ethers.formatEther(ethAmount)} ETH`);

              try {
                const ethAfriPriceWei = await this.getEthAfriPrice();
                const afriAmount = (ethAmount * ethAfriPriceWei) / ethers.parseEther('1');
                
                // ✅ FIXED: Pass wallet address to fundUserWithAfriCoin
                // The function will find the user by wallet address and update their balance
                const result = await this.walletService.fundUserWithAfriCoin(
                  depositorAddress,  // Wallet address where ETH was sent from
                  ethers.formatEther(afriAmount)
                );

                console.log(`✅ Minted ${ethers.formatEther(afriAmount)} AFRI to ${depositorAddress}. TX: ${result.txHash}`);
              } catch (error) {
                console.error('❌ Failed to process deposit:', error);
              }
            } else {
              console.warn('⚠️ Event does not have args property:', event);
            }
          }

          lastBlock = currentBlock;
        }
      } catch (error) {
        this.retryCount++;
        const delay = this.baseDelay * Math.pow(2, this.retryCount - 1);
        
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