import User, { IUser } from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { hashPhone, generateWalletAddress } from "../utils/phoneHash.js";
import { AppError, errorResponses } from "../utils/errorHandler.js";
import bcryptjs from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export class WalletService {
  async createWallet(
    phone: string,
    name: string,
    pin: string
  ): Promise<{ phoneHash: string; walletAddress: string }> {
    try {
      // Check if user exists
      const phoneHash = hashPhone(phone);
      const existingUser = await User.findOne({ phoneHash });

      if (existingUser) {
        throw new AppError(
          errorResponses.PHONE_EXISTS.statusCode,
          errorResponses.PHONE_EXISTS.message
        );
      }

      // Hash PIN
      const pinHash = await bcryptjs.hash(pin, 10);

      // Generate wallet address (mock)
      const walletAddress = generateWalletAddress();

      // Mint initial tokens (mock)
      const initialBalance = (BigInt(process.env.INITIAL_MINT_AMOUNT || "1000000") * BigInt(10) ** BigInt(18)).toString();

      // Create user
      const user = new User({
        phoneHash,
        phone,
        name,
        pinHash,
        walletAddress,
        balance: initialBalance,
      });

      await user.save();

      // Log mint transaction
      await Transaction.create({
        transactionHash: `0x${uuidv4().replace(/-/g, "")}`,
        senderPhoneHash: "system",
        senderPhone: "system",
        recipientPhone: phone,
        amount: initialBalance,
        status: "completed",
        type: "mint",
        metadata: { reason: "initial_mint" },
      });

      return { phoneHash, walletAddress };
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