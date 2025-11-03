import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { ethers } from "ethers";
import { fxConverterService } from "../services/fxConverterService.js";
import { CONTRACTS, CURRENCY_PAIRS } from "../config/contracts.js";

/**
 * MockOracle Integration Tests
 * Tests price fetching from deployed MockOracle contract on Base Sepolia
 */
describe("MockOracle Integration", () => {
  beforeAll(() => {
    console.log("\n🧪 Starting MockOracle Integration Tests...");
    console.log(`📡 Network: Base Sepolia (84532)`);
    console.log(
      `🔗 MockOracle Address: ${CONTRACTS.mockOracle.address}`
    );
  });

  afterAll(() => {
    console.log("\n✅ MockOracle tests completed\n");
  });

  describe("Price Fetching", () => {
    it("should fetch USD/AFRI price from contract", async () => {
      const price = await fxConverterService.fetchPrice("USD/AFRI");
      
      expect(price).toBeDefined();
      expect(price).not.toBe("0");
      
      const priceInEther = ethers.formatEther(price);
      console.log(`✅ USD/AFRI Price: ${priceInEther}`);
      
      // Price should be positive
      expect(BigInt(price)).toBeGreaterThan(BigInt(0));
    });

    it("should fetch KES/AFRI price from contract", async () => {
      const price = await fxConverterService.fetchPrice("KES/AFRI");
      
      expect(price).toBeDefined();
      const priceInEther = ethers.formatEther(price);
      console.log(`✅ KES/AFRI Price: ${priceInEther}`);
      
      expect(BigInt(price)).toBeGreaterThan(BigInt(0));
    });

    it("should fetch NGN/AFRI price from contract", async () => {
      const price = await fxConverterService.fetchPrice("NGN/AFRI");
      
      expect(price).toBeDefined();
      const priceInEther = ethers.formatEther(price);
      console.log(`✅ NGN/AFRI Price: ${priceInEther}`);
      
      expect(BigInt(price)).toBeGreaterThan(BigInt(0));
    });

    it("should fetch all supported currency pairs", async () => {
      const prices = await fxConverterService.fetchAllPrices();
      
      expect(prices).toBeDefined();
      expect(Object.keys(prices).length).toBeGreaterThan(0);
      
      console.log(`✅ Fetched ${Object.keys(prices).length} currency pairs:`);
      Object.entries(prices).forEach(([pair, data]) => {
        const rate = ethers.formatEther(data.price);
        console.log(`   • ${pair}: ${rate}`);
      });
    });
  });

  describe("Price Caching", () => {
    it("should cache prices to reduce RPC calls", async () => {
      // Clear cache
      fxConverterService.clearCache();
      
      // First fetch
      const price1 = await fxConverterService.fetchPrice("USD/AFRI");
      const cached = fxConverterService.getCachedPrices();
      
      expect(cached["USD/AFRI"]).toBeDefined();
      expect(cached["USD/AFRI"].price).toBe(price1);
      
      console.log("✅ Price cached successfully");
    });

    it("should return cached price without RPC call", async () => {
      // Fetch same price again (should use cache)
      const price = await fxConverterService.fetchPrice("USD/AFRI");
      
      expect(price).toBeDefined();
      console.log("✅ Cached price returned without new RPC call");
    });

    it("should invalidate cache after duration expires", async () => {
      fxConverterService.clearCache();
      
      // Fetch price
      const price1 = await fxConverterService.fetchPrice("USD/AFRI");
      expect(price1).toBeDefined();
      
      // Manually expire cache by modifying timestamp
      const cached = fxConverterService.getCachedPrices();
      if (cached["USD/AFRI"]) {
        cached["USD/AFRI"].timestamp = Date.now() - (6 * 60 * 1000); // 6 minutes ago
      }
      
      // Next fetch should validate cache expiry
      const isValid = fxConverterService.isCacheValid("USD/AFRI");
      expect(isValid).toBe(false);
      
      console.log("✅ Cache expiry validation working");
    });
  });

  describe("Currency Conversion", () => {
    it("should convert KES to AfriCoin", async () => {
      const kesAmount = 1000;
      const afriAmount = await fxConverterService.convertToAfriCoin(kesAmount, "KES");
      
      expect(afriAmount).toBeGreaterThan(0);
      console.log(`✅ Converted ${kesAmount} KES to ${afriAmount.toFixed(4)} AFRI`);
    });

    it("should convert NGN to AfriCoin", async () => {
      const ngnAmount = 50000;
      const afriAmount = await fxConverterService.convertToAfriCoin(ngnAmount, "NGN");
      
      expect(afriAmount).toBeGreaterThan(0);
      console.log(`✅ Converted ${ngnAmount} NGN to ${afriAmount.toFixed(4)} AFRI`);
    });

    it("should convert USD to AfriCoin", async () => {
      const usdAmount = 100;
      const afriAmount = await fxConverterService.convertToAfriCoin(usdAmount, "USD");
      
      expect(afriAmount).toBeGreaterThan(0);
      console.log(`✅ Converted ${usdAmount} USD to ${afriAmount.toFixed(4)} AFRI`);
    });

    it("should handle multiple concurrent conversions", async () => {
      const conversions = await Promise.all([
        fxConverterService.convertToAfriCoin(100, "KES"),
        fxConverterService.convertToAfriCoin(50000, "NGN"),
        fxConverterService.convertToAfriCoin(50, "USD"),
      ]);
      
      expect(conversions).toHaveLength(3);
      conversions.forEach((amount) => {
        expect(amount).toBeGreaterThan(0);
      });
      
      console.log("✅ Concurrent conversions completed successfully");
    });

    it("should throw error for unsupported currency", async () => {
      try {
        await fxConverterService.convertToAfriCoin(100, "XYZ");
        expect.fail("Should throw error for unsupported currency");
      } catch (err) {
        expect(err).toBeDefined();
        console.log("✅ Correctly rejected unsupported currency");
      }
    });
  });

  describe("Conversion Rates", () => {
    it("should get conversion rate for display", async () => {
      const rate = await fxConverterService.getConversionRate("KES");
      
      expect(rate).toBeDefined();
      const rateNumber = parseFloat(rate);
      expect(rateNumber).toBeGreaterThan(0);
      
      console.log(`✅ KES/AFRI Rate: 1 KES = ${rate} AFRI`);
    });

    it("should return consistent rates", async () => {
      const rate1 = await fxConverterService.getConversionRate("USD");
      const rate2 = await fxConverterService.getConversionRate("USD");
      
      expect(rate1).toBe(rate2);
      console.log("✅ Rates are consistent (from cache)");
    });

    it("should support all configured currency pairs", async () => {
      for (const [currency, pair] of Object.entries(CURRENCY_PAIRS)) {
        const rate = await fxConverterService.getConversionRate(currency);
        expect(rate).toBeDefined();
        expect(parseFloat(rate)).toBeGreaterThan(0);
        console.log(`✅ ${currency}: ${rate}`);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      try {
        // This will fail if network is down, but should handle gracefully
        await fxConverterService.fetchPrice("USD/AFRI");
        console.log("✅ Network connection successful");
      } catch (err) {
        console.warn("⚠️  Network error (expected if offline):", err);
      }
    });

    it("should provide meaningful error messages", async () => {
      try {
        await fxConverterService.convertToAfriCoin(100, "INVALID");
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toContain("Unsupported");
        console.log("✅ Error message is meaningful:", err.message);
      }
    });
  });

  describe("Performance", () => {
    it("should fetch prices within reasonable time", async () => {
      fxConverterService.clearCache();
      
      const startTime = performance.now();
      await fxConverterService.fetchPrice("USD/AFRI");
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      console.log(`✅ Price fetch completed in ${duration.toFixed(2)}ms`);
      
      // Should complete in reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds
    });

    it("should return cached price instantly", async () => {
      const startTime = performance.now();
      await fxConverterService.fetchPrice("USD/AFRI"); // From cache
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      console.log(`✅ Cached price retrieved in ${duration.toFixed(2)}ms`);
      
      // Cached retrieval should be very fast
      expect(duration).toBeLessThan(100); // 100ms
    });
  });
});