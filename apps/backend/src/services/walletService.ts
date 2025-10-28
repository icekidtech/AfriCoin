import User, { IUser } from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { hashPhone, generateWalletAddress } from "../utils/phoneHash.js";
import { AppError, errorResponses } from "../utils/errorHandler.js";
import bcryptjs from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export class WalletService {
  async createWallet(
    phoneHash: string,
    name: string,
    pin: string
  ): Promise<{ success: boolean; phoneHash: string; balance: string }> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ phoneHash });
      if (existingUser) {
        throw new AppError(400, "User already exists");
      }

      // Create new user with 0 balance (not 1 million)
      const user = new User({
        phoneHash,
        name,
        pin,
        balance: "0", // Start with 0 balance
        createdAt: new Date(),
      });

      await user.save();

      return {
        success: true,
        phoneHash,
        balance: "0",
      };
    } catch (error) {
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

export default new WalletService();