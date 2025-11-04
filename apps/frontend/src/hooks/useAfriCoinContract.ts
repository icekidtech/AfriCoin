import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { AFRICOIN_ADDRESS, AFRICOIN_ABI } from '@/config/contracts';

interface FundingResult {
  txHash: string;
  amount: string;
  recipient: string;
}

export const useAfriCoinContract = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fundUserAccount = useCallback(
    async (
      recipientAddress: string,
      amountInEther: string,
      signer: ethers.Signer
    ): Promise<FundingResult | null> => {
      try {
        setLoading(true);
        setError(null);

        // Create contract instance
        const contract = new ethers.Contract(
          AFRICOIN_ADDRESS,
          AFRICOIN_ABI,
          signer
        );

        // Convert amount to wei
        const amountInWei = ethers.parseEther(amountInEther);

        // Mint tokens to user (assuming owner/backend signs this)
        const tx = await contract.mint(recipientAddress, amountInWei);
        const receipt = await tx.wait();

        return {
          txHash: receipt.hash,
          amount: amountInEther,
          recipient: recipientAddress,
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to fund account';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const checkBalance = useCallback(
    async (address: string, provider: ethers.Provider) => {
      try {
        const contract = new ethers.Contract(
          AFRICOIN_ADDRESS,
          AFRICOIN_ABI,
          provider
        );
        const balance = await contract.balanceOf(address);
        return ethers.formatEther(balance);
      } catch (err) {
        console.error('Failed to check balance:', err);
        return '0';
      }
    },
    []
  );

  return {
    fundUserAccount,
    checkBalance,
    loading,
    error,
  };
};