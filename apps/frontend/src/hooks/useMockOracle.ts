import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACTS, CURRENCY_PAIRS, PRICE_CACHE_DURATION } from "@/config/contracts";
import { MOCK_ORACLE_ABI } from "@/config/abis";

interface PriceCache {
  [key: string]: {
    price: string;
    timestamp: number;
  };
}

export const useMockOracle = () => {
  const [prices, setPrices] = useState<PriceCache>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const provider = new ethers.JsonRpcProvider(
    import.meta.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org"
  );

  const oracle = new ethers.Contract(
    CONTRACTS.mockOracle.address,
    MOCK_ORACLE_ABI,
    provider
  );

  /**
   * Check if price is cached and still valid
   */
  const isCachValid = useCallback((pair: string): boolean => {
    const cached = prices[pair];
    if (!cached) return false;
    return Date.now() - cached.timestamp < PRICE_CACHE_DURATION;
  }, [prices]);

  /**
   * Fetch price for a currency pair
   */
  const fetchPrice = useCallback(
    async (pair: string): Promise<string> => {
      // Return cached price if valid
      if (isCachValid(pair)) {
        return prices[pair].price;
      }

      try {
        setLoading(true);
        setError(null);

        // Convert pair string to bytes32
        const pairBytes32 = ethers.id(pair);
        const price = await oracle.getLatestPrice(pairBytes32);

        // Update cache
        setPrices((prev) => ({
          ...prev,
          [pair]: {
            price: price.toString(),
            timestamp: Date.now(),
          },
        }));

        return price.toString();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch price";
        setError(errorMessage);
        console.error("MockOracle fetch error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isCachValid, prices, oracle]
  );

  /**
   * Fetch all currency pairs at once
   */
  const fetchAllPrices = useCallback(async (): Promise<PriceCache> => {
    try {
      setLoading(true);
      setError(null);

      const newPrices: PriceCache = { ...prices };

      for (const [currency, pair] of Object.entries(CURRENCY_PAIRS)) {
        // Skip if cached
        if (isCachValid(pair)) {
          continue;
        }

        const price = await fetchPrice(pair);
        newPrices[pair] = {
          price,
          timestamp: Date.now(),
        };
      }

      setPrices(newPrices);
      return newPrices;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch prices";
      setError(errorMessage);
      console.error("MockOracle fetchAll error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isCachValid, fetchPrice, prices]);

  /**
   * Convert fiat amount to AfriCoin based on FX rate
   */
  const convertToAfriCoin = useCallback(
    async (amount: number, currency: string): Promise<number> => {
      const pair = CURRENCY_PAIRS[currency as keyof typeof CURRENCY_PAIRS];
      if (!pair) {
        throw new Error(`Unsupported currency: ${currency}`);
      }

      const priceWei = await fetchPrice(pair);
      // Price is in wei (18 decimals)
      // Amount * price = AfriCoin amount
      const priceInEther = ethers.formatEther(priceWei);
      return amount * parseFloat(priceInEther);
    },
    [fetchPrice]
  );

  /**
   * Get conversion rate for display
   */
  const getConversionRate = useCallback(
    async (currency: string): Promise<string> => {
      const pair = CURRENCY_PAIRS[currency as keyof typeof CURRENCY_PAIRS];
      if (!pair) {
        throw new Error(`Unsupported currency: ${currency}`);
      }

      const priceWei = await fetchPrice(pair);
      const rate = ethers.formatEther(priceWei);
      return rate;
    },
    [fetchPrice]
  );

  return {
    prices,
    loading,
    error,
    fetchPrice,
    fetchAllPrices,
    convertToAfriCoin,
    getConversionRate,
    isCachValid,
  };
};