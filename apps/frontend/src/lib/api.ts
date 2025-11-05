import axios from "axios";
import { hashPhone } from "./utils.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

// Store phoneHash in localStorage after onboarding
const getPhoneHash = () => localStorage.getItem("phoneHash");

export const api = {
  // OTP endpoints
  otp: {
    send: (phone: string) =>
      apiClient.post("/otp/send", { phone }),
    
    verify: (phone: string, code: string) =>
      apiClient.post("/otp/verify", { phone, code }),
    
    resend: (phone: string) =>
      apiClient.post("/otp/resend", { phone }),
  },

  // Wallet endpoints
  wallet: {
    onboard: (phone: string, name: string, pin: string) =>
      apiClient.post("/wallet/onboard", { phone, name, pin }),
    
    getBalance: (phoneHash: string) =>
      apiClient.get(`/wallet/balance/${phoneHash}`),
    
    verifyPin: (phoneHash: string, pin: string) =>
      apiClient.post("/wallet/verify-pin", { phoneHash, pin }),
  },

  // Transfer endpoints
  transfer: {
    send: (senderPhoneHash: string, recipientPhone: string, amount: string, pin: string) =>
      apiClient.post("/transfer/send", {
        senderPhoneHash,
        recipientPhone,
        amount,
        pin,
      }),
    
    getHistory: (phoneHash: string, limit?: number) =>
      apiClient.get(`/transfer/history/${phoneHash}`, {
        params: { limit },
      }),
  },
};

export default api;