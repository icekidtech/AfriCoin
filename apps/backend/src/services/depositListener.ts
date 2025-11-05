import { ethers } from 'ethers';
import { WalletService } from './walletService';
import { CONTRACTS, AFRICOIN_ABI, CURRENCY_PAIRS } from '../config/contracts';
import { fxConverterService } from './fxConverterService';

export class DepositListener {
  private provider: ethers.Provider;
  private contract: ethers.Contract;
  private walletService: WalletService;
  private mockOracleContract: ethers.Contract;

  constructor() {
    // Replace with your actual RPC URL source, e.g., process.env.RPC_URL or a config value
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

    setInterval(async () => {
      try {
        const currentBlock = await this.provider.getBlockNumber();
        
        if (currentBlock > lastBlock) {
          const events = await this.contract.queryFilter(
            this.contract.filters.Deposit(),
            lastBlock + 1,
            currentBlock
          );

          for (const event of events) {
            const user = event.args?.[0];
            const ethAmount = event.args?.[1];
            
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
        console.error('❌ Polling error:', error);
      }
    }, 12000); // Poll every 12 seconds (Base block time)

    this.provider.on('error', (error) => {
      console.error('❌ Provider error:', error);
    });
  }

  /**
   * Fetch ETH/AFRI price from MockOracle contract
   * @returns Price in wei (18 decimals) - represents how many AFRI per 1 ETH
   */
  private async getEthAfriPrice(): Promise<bigint> {
    try {
      // Convert pair string to bytes32 hash
      const pairBytes32 = ethers.id('ETH/AFRI');
      
      console.log(`🔍 Fetching ETH/AFRI price from MockOracle...`);
      console.log(`   Pair hash: ${pairBytes32}`);
      console.log(`   MockOracle address: ${CONTRACTS.mockOracle.address}`);

      // Call MockOracle.getLatestPrice()
      const price = await this.mockOracleContract.getLatestPrice(pairBytes32);

      console.log(`✅ Retrieved ETH/AFRI price: ${price.toString()} wei (${ethers.formatEther(price)} AFRI/ETH)`);
      
      return price;
    } catch (error) {
      console.error('❌ Error fetching price from MockOracle:', error);
      
      // Fallback to cached price or default
      try {
        const cachedPrice = await fxConverterService.fetchPrice('ETH/AFRI');
        console.log(`⚠️  Using cached price: ${cachedPrice}`);
        return BigInt(cachedPrice);
      } catch (cacheError) {
        console.error('❌ Failed to get cached price, using hardcoded fallback');
        // Fallback: 1 ETH = 25M AFRI (from your MockOracle initialization)
        return ethers.parseEther('25000000');
      }
    }
  }

  /**
   * Stop listening to Deposit events
   */
  stopListening() {
    console.log('🛑 Stopping Deposit event listener...');
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