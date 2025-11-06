import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { hashPhone, generateWalletAddress } from "../utils/phoneHash.js";
import { AppError, errorResponses } from "../utils/errorHandler.js";
import bcryptjs from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { ethers } from 'ethers';
import { AFRICOIN_ADDRESS, AFRICOIN_ABI } from '../config/contracts.js';
import dotenv from 'dotenv';

// Load .env at the top of this module
dotenv.config();

const BASE_SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
const PRIVATE_KEY = process.env.BACKEND_PRIVATE_KEY || '';

export class WalletService {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private contract: ethers.Contract;

  constructor() {
    // Validate private key exists
    if (!PRIVATE_KEY || PRIVATE_KEY.trim().length === 0) {
      throw new Error('BACKEND_PRIVATE_KEY environment variable is not set');
    }

    let privateKey = PRIVATE_KEY.trim();

    // Remove 0x prefix if it exists (for flexibility)
    if (privateKey.startsWith('0x') || privateKey.startsWith('0X')) {
      privateKey = privateKey.slice(2);
    }

    // Validate format: should be exactly 64 hex characters
    if (privateKey.length !== 64) {
      throw new Error(
        `Invalid BACKEND_PRIVATE_KEY format. Expected 64 hex characters, got ${privateKey.length}`
      );
    }

    // Validate it's valid hex
    if (!/^[0-9a-fA-F]+$/.test(privateKey)) {
      throw new Error('BACKEND_PRIVATE_KEY must contain only hex characters (0-9, a-f, A-F)');
    }

    this.provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC);
    // ethers.js will handle the format internally
    this.signer = new ethers.Wallet(privateKey, this.provider);
    this.contract = new ethers.Contract(
      AFRICOIN_ADDRESS,
      AFRICOIN_ABI,
      this.signer
    );

    console.log(`✅ WalletService initialized with address: ${(this.signer as ethers.Wallet).address}`);
  }

  /**
   * Fund a user's wallet with AfriCoin tokens
   * Called after fiat conversion
   */
  async fundUserWithAfriCoin(
    depositWalletAddress: string,
    amount: string
  ): Promise<any> {
    try {
      const amountWei = ethers.parseEther(amount);

      // ✅ Find user by depositWalletAddress (where ETH came from)
      const user = await User.findOne({ depositWalletAddress });
      
      if (!user) {
        console.warn(`⚠️  User not found for deposit wallet: ${depositWalletAddress}`);
        return { txHash: null, error: "User not found" };
      }

      // ✅ IMPORTANT: Mint to user's SYSTEM wallet (walletAddress), not the deposit wallet
      const tx = await this.contract.mint(user.walletAddress, amountWei);
      const receipt = await tx.wait();

      if (!receipt) throw new Error("Mint transaction failed");

      console.log(`✅ Tokens minted on-chain. TX: ${receipt.hash}`);

      // ✅ Update user's balance in database
      const currentBalance = BigInt(user.balance || '0');
      const newBalance = (currentBalance + amountWei).toString();
      
      user.balance = newBalance;
      await user.save();

      // ✅ Create transaction record
      await Transaction.create({
        transactionHash: receipt.hash,
        senderPhoneHash: "blockchain-deposit",
        senderPhone: "blockchain",
        recipientPhoneHash: user.phoneHash,
        recipientPhone: user.phone,
        amount: amountWei.toString(),
        status: "completed",
        type: "receive",
        metadata: {
          source: "eth-deposit",
          depositWalletAddress,  // Where it came from
          receivingWallet: user.walletAddress  // Where it went
        }
      });

      console.log(`✅ Updated balance for user ${user.phoneHash}: +${ethers.formatEther(amountWei)} AFRI to wallet ${user.walletAddress}`);

      return {
        txHash: receipt.hash,
        amount,
        userWallet: user.walletAddress,
      };
    } catch (error) {
      console.error("Failed to fund wallet:", error);
      throw new AppError(500, `Failed to fund wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's AfriCoin balance
   */
  async getUserBalance(walletAddress: string): Promise<string> {
    try {
      const balance = await this.contract.balanceOf(walletAddress);
      return ethers.formatEther(balance);
    } catch (error: any) {
      throw new Error(`Failed to fetch balance: ${error.message}`);
    }
  }

  /**
   * Get contract info
   */
  async getTokenInfo() {
    const name = await this.contract.name();
    const symbol = await this.contract.symbol();
    const decimals = await this.contract.decimals();
    return { name, symbol, decimals };
  }

  async createWallet(
    phoneHash: string,
    name: string,
    pin: string,
    phone: string  // Add phone parameter
  ): Promise<{ success: boolean; phoneHash: string; balance: string; walletAddress: string }> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ phoneHash });
      if (existingUser) {
        throw new AppError(400, "User already exists");
      }

      // Hash the PIN
      const pinHash = await bcryptjs.hash(pin, 10);

      // Generate wallet address
      const walletAddress = generateWalletAddress();

      // Create new user with all required fields
      const user = new User({
        phoneHash,
        phone,  // Add phone
        name,
        pinHash,  // Use hashed PIN, not plain text
        walletAddress,  // Add wallet address
        balance: "0",
        createdAt: new Date(),
      });

      await user.save();

      return {
        success: true,
        phoneHash,
        walletAddress,
        balance: "0",
      };
    } catch (error) {
      // Log original error for debugging, then rethrow a user-friendly AppError
      console.error("WalletService.createWallet error:", error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        errorResponses.INTERNAL_ERROR.statusCode,
        errorResponses.INTERNAL_ERROR.message
      );
    }
  }

  async getBalance(phoneHash: string): Promise<{ balance: string; decimals: number; symbol: string }> {
    try {
      const user = await User.findOne({ phoneHash });

      if (!user) {
        throw new AppError(
          errorResponses.USER_NOT_FOUND.statusCode,
          errorResponses.USER_NOT_FOUND.message
        );
      }

      return {
        balance: user.balance,
        decimals: 18,
        symbol: "AFRI",
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        errorResponses.INTERNAL_ERROR.statusCode,
        errorResponses.INTERNAL_ERROR.message
      );
    }
  }

  async verifyPin(phoneHash: string, pin: string): Promise<boolean> {
    try {
      const user = await User.findOne({ phoneHash });

      if (!user) {
        throw new AppError(
          errorResponses.USER_NOT_FOUND.statusCode,
          errorResponses.USER_NOT_FOUND.message
        );
      }

      const isValid = await bcryptjs.compare(pin, user.pinHash);

      if (!isValid) {
        throw new AppError(
          errorResponses.INVALID_CREDENTIALS.statusCode,
          errorResponses.INVALID_CREDENTIALS.message
        );
      }

      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        errorResponses.INTERNAL_ERROR.statusCode,
        errorResponses.INTERNAL_ERROR.message
      );
    }
  }

  /**
   * Connect a crypto wallet for deposits (user can change this anytime)
   */
  async connectDepositWallet(
    phoneHash: string,
    depositWalletAddress: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = await User.findOne({ phoneHash });
      if (!user) {
        throw new AppError(404, "User not found");
      }

      const oldWallet = user.depositWalletAddress;
      user.depositWalletAddress = depositWalletAddress;
      await user.save();

      console.log(`✅ Updated deposit wallet for ${phoneHash}: ${oldWallet} → ${depositWalletAddress}`);

      return {
        success: true,
        message: `Deposit wallet updated to ${depositWalletAddress}`,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Failed to connect deposit wallet");
    }
  }

  /**
   * Get user's balance from blockchain (by wallet address)
   * Useful when depositWalletAddress isn't set in database yet
   */
  async getBalanceFromBlockchain(walletAddress: string): Promise<string> {
    try {
      const balance = await this.contract.balanceOf(walletAddress);
      return ethers.formatEther(balance);
    } catch (error: any) {
      throw new AppError(500, `Failed to fetch balance from blockchain: ${error.message}`);
    }
  }

  /**
   * Get balance - tries database first, falls back to blockchain
   */
  async getBalanceFlexible(phoneHashOrWalletAddress: string): Promise<{ balance: string; decimals: number; symbol: string; source: string }> {
    try {
      // First try: Find user by phoneHash and get database balance
      const user = await User.findOne({ phoneHash: phoneHashOrWalletAddress });
      if (user && user.balance !== "0") {
        return {
          balance: user.balance,
          decimals: 18,
          symbol: "AFRI",
          source: "database",
        };
      }

      // Second try: If no balance or user not found, try as wallet address
      const blockchainBalance = await this.getBalanceFromBlockchain(phoneHashOrWalletAddress);
      if (blockchainBalance !== "0") {
        return {
          balance: ethers.parseEther(blockchainBalance).toString(),
          decimals: 18,
          symbol: "AFRI",
          source: "blockchain",
        };
      }

      // Fallback: Try blockchain lookup by user's generated walletAddress
      if (user?.walletAddress) {
        const walletBalance = await this.getBalanceFromBlockchain(user.walletAddress);
        return {
          balance: ethers.parseEther(walletBalance).toString(),
          decimals: 18,
          symbol: "AFRI",
          source: "blockchain-generated-wallet",
        };
      }

      return {
        balance: "0",
        decimals: 18,
        symbol: "AFRI",
        source: "none",
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        errorResponses.INTERNAL_ERROR.statusCode,
        "Failed to fetch balance"
      );
    }
  }
}

export const walletService = new WalletService();