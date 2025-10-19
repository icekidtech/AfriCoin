# Frontend PWA Development Guide

**Related Milestone:** [Milestone 2: Core Features & PWA](../milestones/MILESTONES.md#milestone-2-core-features--pwa)

## Overview

This document provides a comprehensive guide for developing the React + Vite PWA frontend for AfriCoin.

## Table of Contents

1. [Setup](#setup)
2. [Project Structure](#project-structure)
3. [Core Features](#core-features)
4. [Page Components](#page-components)
5. [PWA Configuration](#pwa-configuration)
6. [State Management](#state-management)
7. [Styling](#styling)

---

## Setup

### Prerequisites

- Node.js >= 16.x
- npm or yarn

### Installation

```bash
cd apps/frontend

npm install

# Install required dependencies
npm install react-router-dom ethers web3js @tanstack/react-query axios

# UI Framework
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Internationalization
npm install i18next react-i18next i18next-browser-languagedetector

# PWA support
npm install workbox-window
```

---

## Project Structure

```
apps/frontend/
├── src/
│   ├── components/
│   │   ├── WalletCard.tsx          # Display wallet balance
│   │   ├── TransactionList.tsx     # List transactions
│   │   ├── SendForm.tsx            # Send transaction form
│   │   ├── ReceiveModal.tsx        # Show receive address
│   │   ├── VoiceButton.tsx         # Voice command button
│   │   └── Layout.tsx              # Common layout
│   ├── pages/
│   │   ├── Onboarding.tsx          # Initial setup
│   │   ├── Dashboard.tsx           # Main dashboard
│   │   ├── Send.tsx                # Send money page
│   │   ├── Receive.tsx             # Receive money page
│   │   ├── History.tsx             # Transaction history
│   │   ├── Settings.tsx            # User settings
│   │   └── NotFound.tsx            # 404 page
│   ├── hooks/
│   │   ├── useWallet.ts            # Wallet operations
│   │   ├── useVoiceLLM.ts          # Voice command processing
│   │   ├── useTransactions.ts      # Transaction queries
│   │   └── useAuth.ts              # Authentication
│   ├── utils/
│   │   ├── api.ts                  # API client
│   │   ├── phoneHash.ts            # Phone hashing
│   │   ├── formatters.ts           # Format helpers
│   │   └── validators.ts           # Input validation
│   ├── locales/
│   │   ├── en.json                 # English translations
│   │   ├── sw.json                 # Swahili translations
│   │   └── fr.json                 # French translations
│   ├── App.tsx                     # Root component
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Global styles
├── public/
│   ├── manifest.json               # PWA manifest
│   ├── service-worker.js           # Service worker
│   └── icons/                      # App icons
├── vite.config.ts                  # Vite configuration
├── tailwind.config.js              # Tailwind configuration
├── tsconfig.json
└── package.json
```

---

## Core Features

### 1. Onboarding Page

```typescript
// src/pages/Onboarding.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { createWallet, isLoading } = useWallet();
  const [formData, setFormData] = useState({
    phone: "",
    name: "",
    pin: "",
    confirmPin: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.pin !== formData.confirmPin) {
      alert("PINs do not match");
      return;
    }

    try {
      await createWallet(formData.phone, formData.name, formData.pin);
      localStorage.setItem("phoneHash", formData.phone);
      navigate("/dashboard");
    } catch (error) {
      console.error("Onboarding failed:", error);
      alert("Onboarding failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-yellow-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          Welcome to AfriCoin
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Create your pan-African wallet
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="tel"
            placeholder="Phone (+254...)"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          <input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          <input
            type="password"
            placeholder="4-Digit PIN"
            value={formData.pin}
            onChange={(e) =>
              setFormData({ ...formData, pin: e.target.value })
            }
            maxLength={4}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          <input
            type="password"
            placeholder="Confirm PIN"
            value={formData.confirmPin}
            onChange={(e) =>
              setFormData({ ...formData, confirmPin: e.target.value })
            }
            maxLength={4}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create Wallet"}
          </button>
        </form>
      </div>
    </div>
  );
};
```

### 2. Dashboard Page

```typescript
// src/pages/Dashboard.tsx
import React, { useEffect } from "react";
import { useWallet } from "../hooks/useWallet";
import { WalletCard } from "../components/WalletCard";
import { TransactionList } from "../components/TransactionList";
import { Link } from "react-router-dom";

export const Dashboard: React.FC = () => {
  const { wallet, fetchWallet } = useWallet();

  useEffect(() => {
    fetchWallet();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">My Wallet</h1>

        <WalletCard balance={wallet?.balance} />

        <div className="grid grid-cols-2 gap-4 mt-6">
          <Link
            to="/send"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg text-center transition"
          >
            Send Money
          </Link>
          <Link
            to="/receive"
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg text-center transition"
          >
            Receive Money
          </Link>
        </div>

        <h2 className="text-lg font-bold mt-8 mb-4 text-gray-800">
          Recent Transactions
        </h2>
        <TransactionList transactions={wallet?.transactions} />
      </div>
    </div>
  );
};
```

### 3. Send Money Page

```typescript
// src/pages/Send.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { useTranslation } from "react-i18next";

export const Send: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { sendMoney, isLoading } = useWallet();
  const [formData, setFormData] = useState({
    recipientPhone: "",
    amount: "",
    pin: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await sendMoney(
        formData.recipientPhone,
        formData.amount,
        formData.pin
      );
      alert("Money sent successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Send failed:", error);
      alert("Send failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">{t("send_money")}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="tel"
            placeholder={t("recipient_phone")}
            value={formData.recipientPhone}
            onChange={(e) =>
              setFormData({ ...formData, recipientPhone: e.target.value })
            }
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="number"
            placeholder={t("amount")}
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="password"
            placeholder="PIN"
            value={formData.pin}
            onChange={(e) =>
              setFormData({ ...formData, pin: e.target.value })
            }
            maxLength={4}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
          >
            {isLoading ? t("sending") : t("send")}
          </button>
        </form>
      </div>
    </div>
  );
};
```

---

## Page Components

Create placeholder pages for routing:

```typescript
// src/pages/Receive.tsx
export const Receive: React.FC = () => {
  return <div className="p-4">Receive Money Page</div>;
};

// src/pages/History.tsx
export const History: React.FC = () => {
  return <div className="p-4">Transaction History Page</div>;
};

// src/pages/Settings.tsx
export const Settings: React.FC = () => {
  return <div className="p-4">Settings Page</div>;
};
```

---

## PWA Configuration

### manifest.json

```json
{
  "name": "AfriCoin - Pan-African Stablecoin",
  "short_name": "AfriCoin",
  "description": "Seamless cross-border transactions across Africa",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#f97316",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/maskable-icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "categories": ["finance"],
  "screenshots": [
    {
      "src": "/screenshots/screenshot1.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

### Service Worker Registration

```typescript
// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("ServiceWorker registered:", registration);
      })
      .catch((error) => {
        console.log("ServiceWorker registration failed:", error);
      });
  });
}
```

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      manifest: {
        name: "AfriCoin",
        short_name: "AfriCoin",
        theme_color: "#f97316",
        description: "Pan-African Digital Stablecoin",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.africoin\.app\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 3600,
              },
            },
          },
        ],
      },
    }),
  ],
});
```

---

## State Management

### useWallet Hook

```typescript
// src/hooks/useWallet.ts
import { useState, useCallback } from "react";
import api from "../utils/api";

interface Wallet {
  balance: string;
  transactions: any[];
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      const phoneHash = localStorage.getItem("phoneHash");
      const response = await api.get(`/wallet/balance/${phoneHash}`);
      setWallet(response.data);
    } catch (err) {
      setError("Failed to fetch wallet");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createWallet = useCallback(async (phone: string, name: string, pin: string) => {
    setIsLoading(true);
    try {
      const response = await api.post("/wallet/onboard", { phone, name, pin });
      localStorage.setItem("phoneHash", response.data.phoneHash);
      return response.data;
    } catch (err) {
      setError("Failed to create wallet");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMoney = useCallback(
    async (recipientPhone: string, amount: string, pin: string) => {
      setIsLoading(true);
      try {
        const phoneHash = localStorage.getItem("phoneHash");
        const response = await api.post("/transfer/send", {
          senderPhoneHash: phoneHash,
          recipientPhone,
          amount,
          pin,
        });
        await fetchWallet(); // Refresh wallet
        return response.data;
      } catch (err) {
        setError("Failed to send money");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchWallet]
  );

  return { wallet, isLoading, error, fetchWallet, createWallet, sendMoney };
};
```

---

## Styling

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        africoin: {
          orange: "#f97316",
          gold: "#fbbf24",
          dark: "#1f2937",
        },
      },
    },
  },
  plugins: [],
};
```

### Global Styles

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary-color: #f97316;
  --secondary-color: #fbbf24;
}

html,
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
    "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans",
    "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

---

## Next Steps

1. ✅ Setup React + Vite
2. ✅ Create page components
3. ✅ Setup PWA manifest
4. ✅ Configure Tailwind CSS
5. Move to [Web3Auth Integration](./06-web3auth-integration.md)

---

**Last Updated:** October 19, 2025  
**Status:** Ready for Development
