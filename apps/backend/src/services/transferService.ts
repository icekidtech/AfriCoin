import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { hashPhone } from "../utils/phoneHash.js";
import { AppError, errorResponses } from "../utils/errorHandler.js";
import { v4 as uuidv4 } from "uuid";

export class TransferService {
  async sendMoney(
    senderPhoneHash: string,
    recipientPhone: string,
    amount: string
  ): Promise<{ transactionHash: string; status: string }> {
    try {
      // Find sender
      const sender = await User.findOne({ phoneHash: senderPhoneHash });
      if (!sender) {
        throw new AppError(
          errorResponses.USER_NOT_FOUND.statusCode,
          "Sender not found"
        );
      }

      // Check balance
      if (BigInt(sender.balance) < BigInt(amount)) {
        throw new AppError(
          errorResponses.INSUFFICIENT_BALANCE.statusCode,
          errorResponses.INSUFFICIENT_BALANCE.message
        );
      }

      // Find recipient
      const recipientPhoneHash = hashPhone(recipientPhone);
      const recipient = await User.findOne({ phoneHash: recipientPhoneHash });

      if (!recipient) {
        throw new AppError(
          errorResponses.RECIPIENT_NOT_FOUND.statusCode,
          errorResponses.RECIPIENT_NOT_FOUND.message
        );
      }

      // Execute transfer
      sender.balance = (BigInt(sender.balance) - BigInt(amount)).toString();
      recipient.balance = (BigInt(recipient.balance) + BigInt(amount)).toString();

      await sender.save();
      await recipient.save();

      // Log transaction
      const transactionHash = `0x${uuidv4().replace(/-/g, "")}`;
      await Transaction.create({
        transactionHash,
        senderPhoneHash,
        senderPhone: sender.phone,
        recipientPhone,
        recipientPhoneHash,
        amount,
        status: "completed",
        type: "send",
      });

      // Log receive transaction for recipient
      await Transaction.create({
        transactionHash: `0x${uuidv4().replace(/-/g, "")}`,
        senderPhoneHash,
        senderPhone: sender.phone,
        recipientPhone,
        recipientPhoneHash,
        amount,
        status: "completed",
        type: "receive",
      });

      return { transactionHash, status: "completed" };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        errorResponses.INTERNAL_ERROR.statusCode,
        errorResponses.INTERNAL_ERROR.message
      );
    }
  }

  async getTransactionHistory(
    phoneHash: string,
    limit: number = 20
  ): Promise<any[]> {
    try {
      const transactions = await Transaction.find({
        $or: [{ senderPhoneHash: phoneHash }, { recipientPhoneHash: phoneHash }],
      })
        .sort({ timestamp: -1 })
        .limit(limit);

      return transactions;
    } catch (error) {
      throw new AppError(
        errorResponses.INTERNAL_ERROR.statusCode,
        errorResponses.INTERNAL_ERROR.message
      );
    }
  }
}

export default new TransferService();