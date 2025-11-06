import { Request, Response } from "express";
import { ethers } from "ethers";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import { walletService } from "../services/walletService.js";
import { fxConverterService } from "../services/fxConverterService.js";

/**
 * Fund wallet with conversion from fiat to AfriCoin
 * Handles mobile money, bank transfer, and crypto funding
 */
export const fundWallet = async (req: Request, res: Response) => {
  try {
    const {
      amount,
      phoneHash,
      method,
      currency = "KES",
      txHash,
    } = req.body;

    // Validate input
    if (!amount || !phoneHash || !method) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: amount, phoneHash, method",
      });
    }

    if (!["mobileMoney", "bankTransfer", "wallet"].includes(method)) {
      return res.status(400).json({
        success: false,
        error: "Invalid funding method",
      });
    }

    // Get wallet
    const wallet = await Wallet.findOne({ phoneHash });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "Wallet not found",
      });
    }

    let afriCoinAmount = amount;

    // Convert currency to AfriCoin if not crypto
    if (method !== "wallet") {
      try {
        afriCoinAmount = await fxConverterService.convertToAfriCoin(
          parseFloat(amount),
          currency
        );
      } catch (err) {
        console.error("Conversion error:", err);
        return res.status(500).json({
          success: false,
          error: "Failed to convert currency",
        });
      }
    }

    // Convert to wei
    const amountWei = ethers.parseEther(afriCoinAmount.toString());

    // Create transaction record
    const transaction = new Transaction({
      transactionHash: txHash || `pending-${Date.now()}`,
      senderPhoneHash: process.env.BACKEND_WALLET_HASH || "backend",
      senderPhone: process.env.BACKEND_WALLET_PHONE || "0000000000",
      recipientPhoneHash: phoneHash,
      recipientPhone: wallet.phoneNumber,
      amount: amountWei.toString(),
      status: "pending",
      type: "receive",
      metadata: {
        method,
        currency,
        originalAmount: amount,
        conversionRate:
          method !== "wallet"
            ? (
                parseFloat(afriCoinAmount.toString()) /
                parseFloat(amount)
              ).toString()
            : "1",
      },
    });

    await transaction.save();

    // For mobile money and bank transfer, simulate backend signing
    if (method === "mobileMoney" || method === "bankTransfer") {
      // In production, this would integrate with payment gateway
      // For now, we simulate and mark as pending
      transaction.status = "pending";
      await transaction.save();

      return res.status(200).json({
        success: true,
        data: {
          txHash: transaction.transactionHash,
          amount: afriCoinAmount.toString(),
          currency: "AFRI",
          status: "pending",
          fromAddress: process.env.BACKEND_WALLET_ADDRESS || "0x...",
          toAddress: wallet.walletAddress,
          method,
          message:
            method === "mobileMoney"
              ? "M-Pesa prompt sent. Complete the transaction to fund your wallet."
              : "Bank transfer initiated. Funds will be credited within 24 hours.",
        },
      });
    }

    // For wallet funding, backend has already signed or user will sign
    // Just confirm the transaction was received
    if (method === "wallet") {
      return res.status(200).json({
        success: true,
        data: {
          txHash: txHash,
          amount: afriCoinAmount.toString(),
          currency: "AFRI",
          status: "pending",
          fromAddress: wallet.walletAddress,
          toAddress: wallet.walletAddress,
          method: "wallet",
          message: "Transaction submitted. Waiting for blockchain confirmation.",
        },
      });
    }
  } catch (error) {
    console.error("Fund wallet error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fund wallet",
    });
  }
};

/**
 * Record funding transaction from crypto wallet
 * NEW: Records on-chain crypto transactions
 */
export const recordFundingTransaction = async (req: Request, res: Response) => {
  try {
    const { txHash, amount, fromAddress, toAddress, method } = req.body;

    if (!txHash || !amount || !fromAddress || !toAddress || !method) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: txHash, amount, fromAddress, toAddress, method",
      });
    }

    // Find wallet by address
    const wallet = await Wallet.findOne({ walletAddress: toAddress });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "Wallet not found",
      });
    }

    // Update or create transaction
    const transaction = await Transaction.findOneAndUpdate(
      { transactionHash: txHash },
      {
        transactionHash: txHash,
        senderPhoneHash: wallet.phoneHash,
        senderPhone: wallet.phoneNumber,
        recipientPhoneHash: wallet.phoneHash,
        recipientPhone: wallet.phoneNumber,
        amount: ethers.parseEther(amount).toString(),
        status: "completed",
        type: "receive",
        metadata: {
          method,
          fromAddress,
          toAddress,
          confirmedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // Update wallet balance
    const newBalance =
      BigInt(wallet.balance) + BigInt(ethers.parseEther(amount));
    wallet.balance = newBalance.toString();
    wallet.lastFundedAt = new Date();
    await wallet.save();

    res.status(200).json({
      success: true,
      data: {
        txHash,
        status: "completed",
        newBalance: ethers.formatEther(wallet.balance),
      },
    });
  } catch (error) {
    console.error("Record transaction error:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to record transaction",
    });
  }
};
