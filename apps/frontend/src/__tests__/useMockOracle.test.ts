import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useMockOracle } from "../hooks/useMockOracle";
import { ethers } from "ethers";

/**
 * Frontend MockOracle Hook Tests
 */
describe("useMockOracle Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Price Fetching", () => {
    it("should fetch price for currency pair", async () => {
      const { result } = renderHook(() => useMockOracle());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const price = await result.current.fetchPrice("USD/AFRI");
      expect(price).toBeDefined();
      expect(price).not.toBe("0");
    });

    it("should fetch all prices", async () => {
      const { result } = renderHook(() => useMockOracle());

      const prices = await result.current.fetchAllPrices();

      expect(prices).toBeDefined();
      expect(Object.keys(prices).length).toBeGreaterThan(0);
    });
  });

  describe("Currency Conversion", () => {
    it("should convert amount to AfriCoin", async () => {
      const { result } = renderHook(() => useMockOracle());

      const afriAmount = await result.current.convertToAfriCoin(1000, "KES");

      expect(afriAmount).toBeGreaterThan(0);
    });

    it("should get conversion rate for display", async () => {
      const { result } = renderHook(() => useMockOracle());

      const rate = await result.current.getConversionRate("USD");

      expect(rate).toBeDefined();
      expect(parseFloat(rate)).toBeGreaterThan(0);
    });
  });

  describe("Cache Validation", () => {
    it("should validate cache status", async () => {
      const { result } = renderHook(() => useMockOracle());

      await result.current.fetchPrice("USD/AFRI");
      const isValid = result.current.isCachValid("USD/AFRI");

      expect(isValid).toBe(true);
    });
  });
});