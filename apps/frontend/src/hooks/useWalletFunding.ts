import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "@/config/contracts";
import { AFRICOIN_ABI } from "@/config/abis";
import api from "@/lib/api";

interface FundingTransaction {
  txHash: string;
  amount: string;
  fromAddress: string;
  toAddress: string;
  status: "pending" | "completed" | "failed";
}

export const useWalletFunding = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<FundingTransaction | null>(
    null
  );

  /**
   * Fund wallet via user's connected crypto wallet
   * User signs transaction in their wallet
   */
  const fundViaWallet = useCallback(
    async (
      amount: string,
      recipientAddress: string,
      signer: ethers.Signer
    ): Promise<FundingTransaction> => {
      try {
        setLoading(true);
        setError(null);

        // Get user's address
        const userAddress = await signer.getAddress();

        // IMPORTANT: Validate and convert amount correctly
        let amountWei;
        try {
          // Parse the input amount (assume it's in AFRI token units, not ETH)
          amountWei = ethers.parseEther(amount);
        } catch (err) {
          throw new Error(`Invalid amount format: ${amount}`);
        }

        // Get user's current balance before attempting transfer
        const provider = signer.provider;
        if (!provider) throw new Error("No provider available");

        const contract = new ethers.Contract(
          CONTRACTS.afriCoin.address,
          AFRICOIN_ABI,
          signer
        );

        // Check user's AFRI balance first
        const userBalance = await contract.balanceOf(userAddress);
        if (userBalance < amountWei) {
          throw new Error(
            `Insufficient balance. You have ${ethers.formatEther(userBalance)} AFRI, but trying to send ${amount} AFRI`
          );
        }

        // Execute transfer
        const tx = await contract.transfer(recipientAddress, amountWei);

        // Wait for confirmation
        const receipt = await tx.wait();

        const fundingTx: FundingTransaction = {
          txHash: tx.hash,
          amount: amount,
          fromAddress: userAddress,
          toAddress: recipientAddress,
          status: receipt ? "completed" : "pending",
        };

        setTransaction(fundingTx);

        // Notify backend
        try {
          await api.wallet.recordFundingTransaction({
            txHash: tx.hash,
            amount,
            fromAddress: userAddress,
            toAddress: recipientAddress,
            method: "wallet",
          });
        } catch (backendErr) {
          console.warn("Failed to record transaction in backend:", backendErr);
        }

        return fundingTx;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fund wallet";
        setError(errorMessage);
        console.error("Wallet funding error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Fund wallet via backend (for mobile money/bank transfers)
   * Backend signs transaction on behalf of user
   */
  const fundViaBackend = useCallback(
    async (
      amount: string,
      phoneHash: string,
      method: "mobileMoney" | "bankTransfer",
      currency?: string
    ): Promise<FundingTransaction> => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.wallet.fund({
          amount,
          phoneHash,
          method,
          currency,
        });

        const fundingTx: FundingTransaction = {
          txHash: response.data.data.txHash,
          amount,
          fromAddress: response.data.data.fromAddress,
          toAddress: response.data.data.toAddress,
          status: "pending",
        };

        setTransaction(fundingTx);
        return fundingTx;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fund wallet";
        setError(errorMessage);
        console.error("Backend funding error:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    transaction,
    fundViaWallet,
    fundViaBackend,
  };
};