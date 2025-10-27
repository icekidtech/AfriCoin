import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  phoneHash: string;
  phone: string;
  name: string;
  pinHash: string;
  walletAddress: string;
  balance: string; // Wei as string (BigInt)
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    phoneHash: { type: String, required: true, unique: true, index: true },
    phone: { type: String, required: true },
    name: { type: String, required: true },
    pinHash: { type: String, required: true },
    walletAddress: { type: String, required: true, unique: true },
    balance: { type: String, default: "0" }, // Wei
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);