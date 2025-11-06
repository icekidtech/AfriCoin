import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  phoneHash: string;
  phone: string;
  name: string;
  pinHash: string;
  walletAddress: string; // For transfers OUT
  depositWalletAddress: string | null; // NEW: For deposits IN (can change)
  balance: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema({
  phoneHash: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  name: { type: String, required: true },
  pinHash: { type: String, required: true },
  walletAddress: { type: String, required: true }, // Generated, for transfers OUT
  depositWalletAddress: { type: String, default: null }, // NEW: For deposits IN
  balance: { type: String, default: "0" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>("User", userSchema);