import crypto from "crypto";

export function hashPhone(phone: string): string {
  return crypto.createHash("sha256").update(phone).digest("hex");
}

export function generateWalletAddress(): string {
  return "0x" + crypto.randomBytes(20).toString("hex");
}