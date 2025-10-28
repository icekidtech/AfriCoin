import dotenv from "dotenv";
import twilio from "twilio";
import { AppError, errorResponses } from "../utils/errorHandler";

// Load .env at the top of this module
dotenv.config();

interface StoredOTP {
  code: string;
  phone: string;
  expiresAt: number;
  attempts: number;
}

// In-memory OTP storage (use Redis in production)
const otpStore = new Map<string, StoredOTP>();

export class OTPService {
  private twilioClient: any;
  private twilioPhoneNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || "";

    // Temporary debug logging
    console.log("DEBUG: TWILIO_ACCOUNT_SID =", accountSid ? "SET" : "UNDEFINED");
    console.log("DEBUG: TWILIO_AUTH_TOKEN =", authToken ? "SET" : "UNDEFINED");

    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials not configured");
    }

    this.twilioClient = twilio(accountSid, authToken);
  }

  private generateOTPCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOTP(phone: string): Promise<{ success: boolean; message: string }> {
    try {
      // Validate phone format
      if (!phone.startsWith("+")) {
        throw new AppError(400, "Phone number must include country code (+)");
      }

      // Generate OTP code
      const code = this.generateOTPCode();

      // Store OTP (expires in 10 minutes)
      const expiresAt = Date.now() + 10 * 60 * 1000;
      otpStore.set(phone, {
        code,
        phone,
        expiresAt,
        attempts: 0,
      });

      // Send via Twilio
      try {
        await this.twilioClient.messages.create({
          body: `Your AfriCoin verification code is: ${code}. Valid for 10 minutes.`,
          from: this.twilioPhoneNumber,
          to: phone,
        });
      } catch (twilioError: any) {
        // In development, log the code instead
        if (process.env.NODE_ENV === "development") {
          console.log(`📱 DEV MODE - OTP for ${phone}: ${code}`);
        } else {
          throw twilioError;
        }
      }

      return { success: true, message: "OTP sent successfully" };
    } catch (error) {
      console.error("Failed to send OTP:", error);
      throw new AppError(500, "Failed to send OTP");
    }
  }

  async verifyOTP(
    phone: string,
    code: string
  ): Promise<{ success: boolean; phoneHash?: string }> {
    try {
      const stored = otpStore.get(phone);

      if (!stored) {
        throw new AppError(400, "OTP expired or not found");
      }

      // Check expiration
      if (Date.now() > stored.expiresAt) {
        otpStore.delete(phone);
        throw new AppError(400, "OTP has expired");
      }

      // Check attempts
      if (stored.attempts >= 3) {
        otpStore.delete(phone);
        throw new AppError(429, "Too many attempts. Request a new OTP.");
      }

      // Verify code
      if (stored.code !== code.trim()) {
        stored.attempts++;
        throw new AppError(400, "Invalid OTP code");
      }

      // Success - clean up
      otpStore.delete(phone);

      return { success: true };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, "Failed to verify OTP");
    }
  }

  async resendOTP(phone: string): Promise<{ success: boolean; message: string }> {
    try {
      // Delete old OTP
      otpStore.delete(phone);

      // Send new OTP
      return await this.sendOTP(phone);
    } catch (error) {
      throw new AppError(500, "Failed to resend OTP");
    }
  }
}

export default new OTPService();