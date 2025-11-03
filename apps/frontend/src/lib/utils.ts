import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto-js"; // Install: pnpm add crypto-js @types/crypto-js

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function hashPhone(phone: string): string {
  // Use SHA-256 to hash the phone number
  // This serves as the unique wallet identifier (private key equivalent)
  return crypto.SHA256(phone).toString();
}
