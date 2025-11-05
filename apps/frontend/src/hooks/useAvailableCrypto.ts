import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

interface AvailableCrypto {
  symbol: string;
  balance: string;
  balanceWei: bigint;
  address?: string; // token contract address, undefined for native ETH
  decimals: number;
  icon?: string; // optional icon URL
}

// Base Sepolia token addresses and configs
const SUPPORTED_TOKENS: Record<string, { address: string; decimals: number; icon?: string }> = {
  // Stablecoins
  USDC: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
    icon: 'https://raw.githubusercontent.com/Uniswap/smart-order-router/main/images/USDC.png',
  },
  USDT: {
    address: '0xfA9343C3897324496A05fC75abeAD6dd30C5cf36',
    decimals: 6,
    icon: 'https://raw.githubusercontent.com/Uniswap/smart-order-router/main/images/USDT.png',
  },
  DAI: {
    address: '0x50c5725949A6F68dEfdeC694C0FFA86aB57FD7B1',
    decimals: 18,
    icon: 'https://raw.githubusercontent.com/Uniswap/smart-order-router/main/images/DAI.png',
  },
  // Wrapped assets
  WETH: {
    address: '0x4200000000000000000000000000000000000006',
    decimals: 18,
    icon: 'https://raw.githubusercontent.com/Uniswap/smart-order-router/main/images/WETH.png',
  },
  CBETH: {
    address: '0x2Ae3F1Ec7F1F5012CFEab0411dafAC2D7d47dd3a',
    decimals: 18,
    icon: 'https://assets.coingecko.com/coins/images/24383/small/cbeth.png',
  },
  // Wrapped stablecoins
  EURC: {
    address: '0x60a3E35Cc302bDA186D53d013C2271F3B81ceb70',
    decimals: 6,
    icon: 'https://assets.coingecko.com/coins/images/26045/small/eurc.png',
  },
};

const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
];

export const useAvailableCrypto = () => {
  const [availableCryptos, setAvailableCryptos] = useState<AvailableCrypto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAvailableCrypto = useCallback(
    async (address: string, provider: ethers.Provider) => {
      try {
        setLoading(true);
        setError(null);
        const available: AvailableCrypto[] = [];

        // Step 1: Check native ETH balance (always check first)
        try {
          const ethBalance = await provider.getBalance(address);
          if (ethBalance > 0n) {
            available.push({
              symbol: 'ETH',
              balance: ethers.formatEther(ethBalance),
              balanceWei: ethBalance,
              decimals: 18,
              icon: 'https://raw.githubusercontent.com/Uniswap/smart-order-router/main/images/ETH.png',
            });
          }
        } catch (err) {
          console.error('Error checking ETH balance:', err);
        }

        // Step 2: Check ERC20 token balances
        for (const [symbol, config] of Object.entries(SUPPORTED_TOKENS)) {
          try {
            const contract = new ethers.Contract(
              config.address,
              ERC20_ABI,
              provider
            );

            // Get balance
            const balance = await contract.balanceOf(address);

            if (balance > 0n) {
              available.push({
                symbol,
                balance: ethers.formatUnits(balance, config.decimals),
                balanceWei: balance,
                address: config.address,
                decimals: config.decimals,
                icon: config.icon,
              });
            }
          } catch (err) {
            console.warn(`Error checking ${symbol} balance:`, err);
            // Continue to next token if one fails
          }
        }

        if (available.length === 0) {
          setError('No supported cryptocurrencies found in your wallet');
        }

        setAvailableCryptos(available);
        return available;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error checking available crypto';
        setError(errorMsg);
        console.error('Error checking available crypto:', error);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { availableCryptos, checkAvailableCrypto, loading, error };
};