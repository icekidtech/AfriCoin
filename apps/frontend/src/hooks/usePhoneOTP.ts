import { useCallback } from "react";
import { api } from "@/lib/api";

export const usePhoneOTP = () => {
  const sendOTP = useCallback(async (phone: string) => {
    try {
      const response = await api.otp.send(phone);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("Failed to send OTP:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to send OTP",
      };
    }
  }, []);

  const verifyOTP = useCallback(async (phone: string, code: string) => {
    try {
      const response = await api.otp.verify(phone, code);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("Failed to verify OTP:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Invalid OTP",
      };
    }
  }, []);

  const resendOTP = useCallback(async (phone: string) => {
    try {
      const response = await api.otp.resend(phone);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("Failed to resend OTP:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Failed to resend OTP",
      };
    }
  }, []);

  return {
    sendOTP,
    verifyOTP,
    resendOTP,
  };
};