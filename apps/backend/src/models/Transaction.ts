import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  transactionHash: string;
  senderPhoneHash: string;
  senderPhone: string;
  recipientPhone: string;
  recipientPhoneHash?: string;
  amount: string; // Wei as string
  status: "pending" | "completed" | "failed";
  type: "send" | "receive" | "mint";
  timestamp: Date;
  metadata?: Record<string, any>;
}

const transactionSchema = new Schema<ITransaction>(
  {
    transactionHash: { type: String, required: true, unique: true, index: true },
    senderPhoneHash: { type: String, required: true, index: true },
    senderPhone: { type: String, required: true },
    recipientPhone: { type: String, required: true },
    recipientPhoneHash: { type: String },
    amount: { type: String, required: true },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "completed" },
    type: { type: String, enum: ["send", "receive", "mint"], required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model<ITransaction>("Transaction", transactionSchema);