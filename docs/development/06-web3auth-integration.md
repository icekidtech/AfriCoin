# Web3Auth MPC Wallet Integration

**Related Milestone:** [Milestone 2: Core Features & PWA](../milestones/MILESTONES.md#milestone-2-core-features--pwa)

## Overview

This document provides a comprehensive guide for integrating Web3Auth's MPC (Multi-Party Computation) wallet for non-custodial, seed phrase-free wallet management.

## Table of Contents

1. [Why Web3Auth?](#why-web3auth)
2. [Setup](#setup)
3. [Core Implementation](#core-implementation)
4. [Authentication Flows](#authentication-flows)
5. [Transaction Signing](#transaction-signing)
6. [Error Handling](#error-handling)

---

## Why Web3Auth?

### Key Advantages for AfriCoin

- **No Seed Phrases:** Users don't need to manage complex seed phrases
- **Phone-Based:** Integrates with phone numbers for African users
- **MPC Security:** Distributed key management, no single point of failure
- **Social Login:** Can support multiple social/mobile login options
- **Non-Custodial:** Users maintain control of keys

### MPC Wallets vs Traditional Wallets

| Aspect | MPC Wallet | Traditional Wallet |
|--------|-----------|-------------------|
| Seed Phrase | Not required | Required |
| UX Friction | Low | High |
| Security | High (distributed) | Depends on key storage |
| Recovery | Social login options | Seed phrase only |
| Ideal for | Mobile-first | Tech-savvy users |

---

## Setup

### Installation

```bash
cd apps/frontend

npm install @web3auth/modal @web3auth/ethereum-provider web3
```

### Configuration

```typescript
// src/config/web3auth.ts
import { Web3Auth } from "@web3auth/modal";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";

const clientId = process.env.VITE_WEB3AUTH_CLIENT_ID || "";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x84b1", // Base Sepolia testnet
  rpcTarget: "https://sepolia.base.org",
  displayName: "Base Sepolia",
  blockExplorer: "https://sepolia.basescan.org",
  ticker: "ETH",
  tickerName: "Ethereum",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

export const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.TESTNET,
  chainConfig,
  privateKeyProvider,
});
```

---

## Core Implementation

### 1. Web3Auth Hook

```typescript
// src/hooks/useWeb3Auth.ts
import { useEffect, useState, useCallback } from "react";
import { web3auth } from "../config/web3auth";
import { IProvider } from "@web3auth/base";

interface AuthState {
  isInitializing: boolean;
  isAuthenticated: boolean;
  user: any | null;
  provider: IProvider | null;
  walletAddress: string | null;
}

export const useWeb3Auth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isInitializing: true,
    isAuthenticated: false,
    user: null,
    provider: null,
    walletAddress: null,
  });

  // Initialize Web3Auth
  useEffect(() => {
    const initWeb3Auth = async () => {
      try {
        await web3auth.initModal();

        // Check if user is already logged in
        if (web3auth.status === "connected") {
          const user = await web3auth.getUserInfo();
          const provider = web3auth.provider;

          setAuthState({
            isInitializing: false,
            isAuthenticated: true,
            user,
            provider,
            walletAddress: await getWalletAddress(provider),
          });
        } else {
          setAuthState((prev) => ({ ...prev, isInitializing: false }));
        }
      } catch (error) {
        console.error("Web3Auth initialization failed:", error);
        setAuthState((prev) => ({ ...prev, isInitializing: false }));
      }
    };

    initWeb3Auth();
  }, []);

  // Login function
  const login = useCallback(async () => {
    try {
      const provider = await web3auth.connect();
      const user = await web3auth.getUserInfo();
      const address = await getWalletAddress(provider);

      setAuthState({
        isInitializing: false,
        isAuthenticated: true,
        user,
        provider,
        walletAddress: address,
      });

      return { user, address };
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await web3auth.logout();
      setAuthState({
        isInitializing: false,
        isAuthenticated: false,
        user: null,
        provider: null,
        walletAddress: null,
      });
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  }, []);

  return { ...authState, login, logout };
};

// Helper function to get wallet address
async function getWalletAddress(provider: IProvider): Promise<string> {
  const web3 = new Web3(provider as any);
  const accounts = await web3.eth.getAccounts();
  return accounts[0];
}
```

### 2. Login Component

```typescript
// src/components/Web3AuthLogin.tsx
import React from "react";
import { useWeb3Auth } from "../hooks/useWeb3Auth";
import { useNavigate } from "react-router-dom";

export const Web3AuthLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login, isInitializing, isAuthenticated, user, walletAddress } =
    useWeb3Auth();

  if (isInitializing) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated && user) {
    return (
      <div className="p-4">
        <h2>Welcome, {user.name}</h2>
        <p>Wallet: {walletAddress}</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition"
    >
      Connect Wallet with Web3Auth
    </button>
  );
};
```

### 3. Wallet Context

```typescript
// src/context/WalletContext.tsx
import React, { createContext, useContext } from "react";
import { useWeb3Auth } from "../hooks/useWeb3Auth";

interface WalletContextType {
  walletAddress: string | null;
  isAuthenticated: boolean;
  provider: any;
  user: any;
  login: () => Promise<any>;
  logout: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  signTransaction: (tx: any) => Promise<any>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { walletAddress, isAuthenticated, provider, user, login, logout } =
    useWeb3Auth();

  const signMessage = async (message: string): Promise<string> => {
    if (!provider) throw new Error("Provider not available");

    const web3 = new Web3(provider);
    const signature = await web3.eth.personal.sign(
      message,
      walletAddress!,
      ""
    );
    return signature;
  };

  const signTransaction = async (tx: any): Promise<any> => {
    if (!provider) throw new Error("Provider not available");

    const web3 = new Web3(provider);
    const signedTx = await web3.eth.signTransaction(tx);
    return signedTx;
  };

  const value: WalletContextType = {
    walletAddress,
    isAuthenticated,
    provider,
    user,
    login,
    logout,
    signMessage,
    signTransaction,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

export const useWalletContext = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWalletContext must be used within WalletProvider");
  }
  return context;
};
```

---

## Authentication Flows

### Flow 1: Phone Number Login

```typescript
// Phone number-based login
const handlePhoneLogin = async (phoneNumber: string) => {
  // Web3Auth supports phone login via SMS
  const provider = await web3auth.connect();
  const address = await getWalletAddress(provider);

  // Hash phone and associate with wallet
  const phoneHash = hashPhone(phoneNumber);
  await api.post("/wallet/associate", {
    phoneHash,
    walletAddress: address,
  });
};
```

### Flow 2: Social Login

```typescript
// Social login (Google, Apple, etc)
const handleSocialLogin = async () => {
  const provider = await web3auth.connect();
  const user = await web3auth.getUserInfo();
  const address = await getWalletAddress(provider);

  // Link social account to wallet
  await api.post("/wallet/link-social", {
    socialId: user.sub,
    walletAddress: address,
    name: user.name,
  });
};
```

### Flow 3: MPC Recovery

```typescript
// Recover wallet using MPC shares
const handleRecovery = async () => {
  try {
    const provider = await web3auth.connect();
    // Web3Auth handles MPC recovery internally
    const address = await getWalletAddress(provider);
    console.log("Wallet recovered:", address);
  } catch (error) {
    console.error("Recovery failed:", error);
  }
};
```

---

## Transaction Signing

### Sign and Send Transaction

```typescript
// src/utils/transactionSigner.ts
import Web3 from "web3";
import { IProvider } from "@web3auth/base";

export async function signAndSendTransaction(
  provider: IProvider,
  from: string,
  to: string,
  value: string,
  data?: string
): Promise<string> {
  const web3 = new Web3(provider);

  const tx = {
    from,
    to,
    value: web3.utils.toWei(value, "ether"),
    data,
    gas: 21000,
    gasPrice: await web3.eth.getGasPrice(),
  };

  // Sign transaction
  const signedTx = await web3.eth.accounts.signTransaction(tx, "");

  if (!signedTx.rawTransaction) {
    throw new Error("Failed to sign transaction");
  }

  // Send raw transaction
  const receipt = await web3.eth.sendSignedTransaction(
    signedTx.rawTransaction
  );
  return receipt.transactionHash;
}
```

### Message Signing for Authentication

```typescript
// Sign message for server authentication
export async function signAuthMessage(
  provider: IProvider,
  walletAddress: string,
  message: string
): Promise<string> {
  const web3 = new Web3(provider);

  const signature = await web3.eth.personal.sign(message, walletAddress, "");
  return signature;
}
```

---

## Error Handling

### Common Errors and Solutions

```typescript
// src/utils/web3authErrors.ts
export const handleWeb3AuthError = (error: any): string => {
  if (error.code === "user_cancelled") {
    return "User cancelled the login process";
  }

  if (error.message.includes("network")) {
    return "Network error. Please check your connection.";
  }

  if (error.message.includes("provider")) {
    return "Provider error. Please try again.";
  }

  return "An unexpected error occurred. Please try again.";
};

// Usage in components
try {
  await login();
} catch (error) {
  const errorMessage = handleWeb3AuthError(error);
  alert(errorMessage);
}
```

---

## Best Practices

1. **Always Check Provider:** Verify provider is available before signing
2. **Handle Network Changes:** Listen for chain/network changes
3. **Secure Storage:** Never store private keys locally
4. **Recovery Codes:** Backup recovery codes for users
5. **Rate Limiting:** Rate limit signing operations
6. **User Confirmation:** Always confirm transactions before signing

---

## Additional Resources

- [Web3Auth Documentation](https://web3auth.io/docs/)
- [MPC Wallet Security](https://blog.web3auth.io/mpc-wallets-explained/)
- [Web3.js Documentation](https://web3js.readthedocs.io/)

---

## Next Steps

1. ✅ Install Web3Auth dependencies
2. ✅ Configure Web3Auth
3. ✅ Implement authentication hooks
4. ✅ Test login/logout flows
5. Move to [USSD Integration Guide](./07-ussd-integration.md)

---

**Last Updated:** October 19, 2025  
**Status:** Ready for Development
