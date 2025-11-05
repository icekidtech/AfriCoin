import User, { IUser } from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { hashPhone, generateWalletAddress } from "../utils/phoneHash.js";
import { AppError, errorResponses } from "../utils/errorHandler.js";
import bcryptjs from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { ethers } from 'ethers';
import { AFRICOIN_ADDRESS, AFRICOIN_ABI } from '../config/contracts';
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
    userWalletAddress: string,
    amountInEther: string
  ): Promise<{ txHash: string; amount: string }> {
    try {
      const amountInWei = ethers.parseEther(amountInEther);

      // Mint tokens
      const tx = await this.contract.mint(userWalletAddress, amountInWei);
      
      // Wait for confirmation
      const receipt = await tx.wait();

      return {
        txHash: receipt!.hash,
        amount: amountInEther,
      };
    } catch (error: any) {
      throw new Error(`Failed to fund wallet: ${error.message}`);
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
      const walletAddress = generateWalletAddress(phoneHash);

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
}

export const walletService = new WalletService();