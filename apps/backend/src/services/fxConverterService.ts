import { ethers } from "ethers";

interface PriceCache {
  [key: string]: {
    price: string;
    timestamp: number;
  };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MOCK_ORACLE_ADDRESS = process.env.VITE_MOCK_ORACLE_ADDRESS;
const BASE_SEPOLIA_RPC = process.env.VITE_BASE_SEPOLIA_RPC;

const MOCK_ORACLE_ABI = [
  {
    inputs: [{ internalType: "bytes32", name: "pair", type: "bytes32" }],
    name: "getLatestPrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

const CURRENCY_PAIRS: { [key: string]: string } = {
  USD: "USD/AFRI",
  EUR: "EUR/AFRI",
  KES: "KES/AFRI",
  NGN: "NGN/AFRI",
  GBP: "GBP/AFRI",
  ZAR: "ZAR/AFRI",
};

class FXConverterService {
  private priceCache: PriceCache = {};
  private provider: ethers.JsonRpcProvider;
  private oracle: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      BASE_SEPOLIA_RPC || "https://sepolia.base.org"
    );
    this.oracle = new ethers.Contract(
      MOCK_ORACLE_ADDRESS || "0x23eE4Cf902129A527Ad93Da8813d16693591F776",
      MOCK_ORACLE_ABI,
      this.provider
    );
  }

  /**
   * Check if cached price is still valid
   */
  private isCacheValid(pair: string): boolean {
    const cached = this.priceCache[pair];
    if (!cached) return false;
    return Date.now() - cached.timestamp < CACHE_DURATION;
  }

  /**
   * Fetch price from MockOracle contract
   */
  async fetchPrice(pair: string): Promise<string> {
    // Return cached price if valid
    if (this.isCacheValid(pair)) {
      return this.priceCache[pair].price;
    }

    try {
      // Convert pair string to bytes32
      const pairBytes32 = ethers.id(pair);
      const price = await this.oracle.getLatestPrice(pairBytes32);

      // Cache the price
      this.priceCache[pair] = {
        price: price.toString(),
        timestamp: Date.now(),
      };

      console.log(`✅ Fetched price for ${pair}: ${price.toString()}`);
      return price.toString();
    } catch (err) {
      console.error(`Failed to fetch price for ${pair}:`, err);
      throw new Error(`Failed to fetch FX rate for ${pair}`);
    }
  }

  /**
   * Fetch prices for all configured currency pairs
   * @returns Promise<Record<string, string>> - Object with pair names as keys and prices as values
   */
  async fetchAllPrices(): Promise<Record<string, string>> {
    const prices: Record<string, string> = {};
    
    // Fetch all prices concurrently
    const promises = Object.values(CURRENCY_PAIRS).map(async (pair) => {
      try {
        const price = await this.fetchPrice(pair);
        prices[pair] = price;
      } catch (error) {
        if (error instanceof Error) {
          console.warn(`Failed to fetch price for ${pair}:`, error.message);
        } else {
          console.warn(`Failed to fetch price for ${pair}:`, error);
        }
        // Skip unsupported pairs instead of failing
      }
    });
    
    await Promise.all(promises);
    return prices;
  }

  /**
   * Convert fiat amount to AfriCoin
   */
  async convertToAfriCoin(
    amount: number,
    currency: string
  ): Promise<number> {
    const pair = CURRENCY_PAIRS[currency];
    if (!pair) {
      throw new Error(`Unsupported currency: ${currency}`);
    }

    try {
      const priceWei = await this.fetchPrice(pair);
      // Price is in wei (18 decimals)
      const priceInEther = ethers.formatEther(priceWei);
      const afriCoinAmount = amount * parseFloat(priceInEther);

      console.log(
        `Converted ${amount} ${currency} to ${afriCoinAmount} AFRI (rate: ${priceInEther})`
      );
      return afriCoinAmount;
    } catch (err) {
      console.error("Conversion error:", err);
      throw err;
    }
  }

  /**
   * Get conversion rate for display
   */
  async getConversionRate(currency: string): Promise<string> {
    const pair = CURRENCY_PAIRS[currency];
    if (!pair) {
      throw new Error(`Unsupported currency: ${currency}`);
    }

    try {
      const priceWei = await this.fetchPrice(pair);
      return ethers.formatEther(priceWei);
    } catch (err) {
      console.error("Get rate error:", err);
      throw err;
    }
  }

  /**
   * Clear cache (for testing)
   */
  clearCache(): void {
    this.priceCache = {};
    console.log("✅ Price cache cleared");
  }

  /**
   * Get cached prices
   */
  getCachedPrices(): PriceCache {
    return this.priceCache;
  }
}

export const fxConverterService = new FXConverterService();