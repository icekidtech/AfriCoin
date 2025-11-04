/**
 * Smart Contract Configuration
 * Addresses and ABIs for AfriCoin and MockOracle
 */

export const CONTRACTS = {
  afriCoin: {
    address: (import.meta.env.VITE_AFRICOIN_ADDRESS ||
      "0x82f3cb249b91523b48FFE531DB55FcdfA931AD92") as `0x${string}`,
    decimals: 18,
    symbol: "AFRI",
  },
  mockOracle: {
    address: (import.meta.env.VITE_MOCK_ORACLE_ADDRESS ||
      "0x23eE4Cf902129A527Ad93Da8813d16693591F776") as `0x${string}`,
  },
};

export const CHAIN_CONFIG = {
  name: "Base Sepolia",
  chainId: 84532,
  rpc: import.meta.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org",
};

// Currency pairs for FX conversion
export const CURRENCY_PAIRS = {
  USD: "USD/AFRI",
  EUR: "EUR/AFRI",
  KES: "KES/AFRI",
  NGN: "NGN/AFRI",
  GBP: "GBP/AFRI",
  ZAR: "ZAR/AFRI",
};

// Cache duration in milliseconds (5 minutes)
export const PRICE_CACHE_DURATION = 5 * 60 * 1000;

export const AFRICOIN_ADDRESS = '0x82f3cb249b91523b48FFE531DB55FcdfA931AD92';
export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';

export const AFRICOIN_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
];