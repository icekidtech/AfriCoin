/**
 * Smart Contract Configuration
 * Addresses and ABIs for AfriCoin and MockOracle
 */

export const CONTRACTS = {
  afriCoin: {
    address: (process.env.VITE_AFRICOIN_ADDRESS ||
      "0x0803B31C1B3f8aF9755e3CF6D66cDb05b574376b") as `0x${string}`,
    decimals: 18,
    symbol: "AFRI",
  },
  mockOracle: {
    address: (process.env.VITE_MOCK_ORACLE_ADDRESS ||
      "0x61fD4399b3f8ff56593c292528c2bbED12654cB8") as `0x${string}`,
  },
};

export const CHAIN_CONFIG = {
  name: "Base Sepolia",
  chainId: 84532,
  rpc: process.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org",
};

// Currency pairs for FX conversion
export const CURRENCY_PAIRS = {
  // Fiat to AFRI
  USD: "USD/AFRI",
  EUR: "EUR/AFRI",
  KES: "KES/AFRI",
  NGN: "NGN/AFRI",
  GBP: "GBP/AFRI",
  ZAR: "ZAR/AFRI",
  
  // Crypto to USD (for dollar-equivalent conversion)
  ETH_USD: "ETH/USD",
  USDC_USD: "USDC/USD",
  USDT_USD: "USDT/USD",
  DAI_USD: "DAI/USD",
  
  // Crypto to AFRI (direct)
  USDC: "USDC/AFRI",
  USDT: "USDT/AFRI",
  DAI: "DAI/AFRI",
  ETH: "ETH/AFRI",
  CBETH: "CBETH/AFRI",
  WETH: "WETH/AFRI",
};

// Cache duration in milliseconds (5 minutes)
export const PRICE_CACHE_DURATION = 5 * 60 * 1000;

export const AFRICOIN_ADDRESS = '0x0803B31C1B3f8aF9755e3CF6D66cDb05b574376b';
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
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'ethAmount', type: 'uint256' },
    ],
    name: 'Deposit',
    type: 'event',
  },
];