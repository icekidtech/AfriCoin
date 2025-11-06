import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const SUPPORTED_TOKENS = {
  ETH: { decimals: 18 },
  USDC: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
  },
  // Only ETH and USDC on Base Sepolia testnet
};

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
];

export const useAvailableCrypto = () => {
  // ✅ Initialize as empty array, NOT undefined
  const [availableCryptos, setAvailableCryptos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const checkAvailableCrypto = async (address: string, provider: ethers.BrowserProvider) => {
    try {
      setLoading(true);
      const cryptos: any[] = [];

      // Check ETH balance
      const ethBalance = await provider.getBalance(address);
      if (ethBalance > 0n) {
        cryptos.push({
          symbol: 'ETH',
          balance: ethers.formatEther(ethBalance),
          balanceWei: ethBalance,
          decimals: 18,
        });
      }

      // Check USDC
      const usdcConfig = SUPPORTED_TOKENS.USDC;
      if (usdcConfig.address) {
        try {
          const contract = new ethers.Contract(
            usdcConfig.address,
            ERC20_ABI,
            provider
          );
          const balance = await contract.balanceOf(address);
          if (balance > 0n) {
            cryptos.push({
              symbol: 'USDC',
              balance: ethers.formatUnits(balance, usdcConfig.decimals),
              balanceWei: balance,
              address: usdcConfig.address,
              decimals: usdcConfig.decimals,
            });
          }
        } catch (err) {
          console.warn('⚠️ Could not check USDC balance');
        }
      }

      setAvailableCryptos(cryptos);
    } catch (err) {
      console.error('Error checking crypto balances:', err);
      setAvailableCryptos([]); // ✅ Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  // ✅ Return proper structure with default empty array
  return { 
    availableCryptos: availableCryptos ?? [], // Ensure never undefined
    checkAvailableCrypto, 
    loading 
  };
};