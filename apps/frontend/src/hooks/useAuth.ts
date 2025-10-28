import { useState, useEffect, useCallback } from "react";
import { usePrivy, useLogin } from "@privy-io/react-auth";
import { api } from "@/lib/api";

export interface AuthUser {
  name: string;
  phone: string;
  phoneHash: string;
  walletAddress: string;
}

export const useAuth = () => {
  const { user: privyUser, authenticated } = usePrivy();
  const { login: privyLogin } = useLogin();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    // Run once on mount to load stored user from localStorage
    const storedUser = localStorage.getItem("user");
    const phoneHash = localStorage.getItem("phoneHash");

    if (storedUser && phoneHash) {
      try {
        const userData = JSON.parse(storedUser);
        setUser({ ...userData, phoneHash });
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("phoneHash");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((userData: AuthUser) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("phoneHash", userData.phoneHash);
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem("user");
    localStorage.removeItem("phoneHash");
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    privyUser,
    privyLogin,
    authenticated,
  };
};