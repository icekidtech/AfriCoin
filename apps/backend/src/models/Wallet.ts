import mongoose, { Schema, Document } from "mongoose";

interface IWallet extends Document {
  phoneHash: string;
  phoneNumber: string;
  walletAddress: string;
  balance: string; // Store as string to handle large numbers
  lastFundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    phoneHash: { type: String, required: true, unique: true, index: true },
    phoneNumber: { type: String, required: true },
    walletAddress: { type: String, required: true, unique: true, index: true },
    balance: { type: String, default: "0" },
    lastFundedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IWallet>("Wallet", walletSchema);