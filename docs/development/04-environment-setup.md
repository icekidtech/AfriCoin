# Environment Configuration Guide

**Related Milestone:** [Milestone 1: Foundation & Infrastructure](../milestones/MILESTONES.md#milestone-1-foundation--infrastructure)

## Overview

This document outlines environment setup and configuration management for the AfriCoin project across development, testing, and production environments.

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Setup by Environment](#setup-by-environment)
3. [Secrets Management](#secrets-management)
4. [Configuration Loading](#configuration-loading)
5. [Local Development](#local-development)

---

## Environment Variables

### Core Variables

```bash
# Node Environment
NODE_ENV=development|production|test

# Server
PORT=3000
BACKEND_URL=http://localhost:3000

# Frontend
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000/api

# Database
DATABASE_URL=mongodb://localhost:27017/africoin
# OR
DATABASE_URL=postgresql://user:password@localhost:5432/africoin

# Blockchain
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_MAINNET_RPC=https://mainnet.base.org
PRIVATE_KEY=your_private_key_hex

# Web3Auth
WEB3AUTH_CLIENT_ID=your_client_id
WEB3AUTH_NETWORK=testnet

# Africa's Talking
AFRICAS_TALKING_API_KEY=your_api_key
AFRICAS_TALKING_USERNAME=your_username
AFRICAS_TALKING_SHORTCODE=888

# Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRY=7d
BCRYPT_ROUNDS=10

# External APIs
CHAINLINK_API_KEY=your_chainlink_key
HUGGING_FACE_API_KEY=your_hugging_face_key
ETHERSCAN_API_KEY=your_etherscan_key

# Redis (for job queuing)
REDIS_URL=redis://localhost:6379

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info|debug|error

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

---

## Setup by Environment

### Development Environment

**File:** `.env.development`

```bash
NODE_ENV=development
PORT=3000
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000/api

# Local MongoDB
DATABASE_URL=mongodb://localhost:27017/africoin-dev

# Base Sepolia Testnet
BASE_SEPOLIA_RPC=https://sepolia.base.org
PRIVATE_KEY=your_dev_private_key

# Web3Auth Testnet
WEB3AUTH_CLIENT_ID=your_dev_client_id
WEB3AUTH_NETWORK=testnet

# Africa's Talking Sandbox
AFRICAS_TALKING_API_KEY=your_sandbox_key
AFRICAS_TALKING_USERNAME=sandbox

# Loose security for development
JWT_SECRET=dev_secret_key_change_in_production
BCRYPT_ROUNDS=5

# Verbose logging
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

### Testing Environment

**File:** `.env.test`

```bash
NODE_ENV=test
PORT=3001
DATABASE_URL=mongodb://localhost:27017/africoin-test

# Use local Hardhat node for testing
BASE_SEPOLIA_RPC=http://localhost:8545

# Test credentials
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb476caded87d1a67e8c2c3f9aac1

# Disable external APIs
WEB3AUTH_CLIENT_ID=test_client_id
AFRICAS_TALKING_API_KEY=test_api_key

JWT_SECRET=test_secret
LOG_LEVEL=error
CORS_ORIGIN=http://localhost:5173
```

### Production Environment

**File:** `.env.production` (never commit to repo)

```bash
NODE_ENV=production
PORT=3000
BACKEND_URL=https://api.africoin.app
FRONTEND_URL=https://africoin.app
VITE_API_URL=https://api.africoin.app/api

# Production Database (use managed service)
DATABASE_URL=postgresql://prod_user:strong_password@db.africoin.app:5432/africoin

# Base Mainnet
BASE_SEPOLIA_RPC=https://mainnet.base.org
PRIVATE_KEY=${VAULT_PRIVATE_KEY}  # Load from secrets vault

# Web3Auth Production
WEB3AUTH_CLIENT_ID=${VAULT_WEB3AUTH_CLIENT_ID}
WEB3AUTH_NETWORK=mainnet

# Africa's Talking Production
AFRICAS_TALKING_API_KEY=${VAULT_AFRICAS_TALKING_KEY}
AFRICAS_TALKING_USERNAME=africoin_prod

# Strong security settings
JWT_SECRET=${VAULT_JWT_SECRET}
BCRYPT_ROUNDS=12

# Sentry for error tracking
SENTRY_DSN=${VAULT_SENTRY_DSN}
LOG_LEVEL=warn

# Restricted CORS
CORS_ORIGIN=https://africoin.app

# Redis for distributed cache/queues
REDIS_URL=${VAULT_REDIS_URL}
```

---

## Secrets Management

### Local Development (Git-Ignored)

1. Create `.env.local` file (NOT committed to Git)
2. Use for sensitive values during development

```bash
# .env.local (add to .gitignore)
PRIVATE_KEY=your_actual_private_key
WEB3AUTH_CLIENT_ID=your_actual_client_id
AFRICAS_TALKING_API_KEY=your_actual_api_key
JWT_SECRET=your_actual_secret
```

### Production Secrets Management

#### Option 1: Environment Variables (CI/CD)

For GitHub Actions or Vercel:

```yaml
# .github/workflows/deploy.yml
env:
  PRIVATE_KEY: ${{ secrets.PROD_PRIVATE_KEY }}
  DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
  JWT_SECRET: ${{ secrets.PROD_JWT_SECRET }}
```

#### Option 2: Secrets Vault (e.g., HashiCorp Vault, AWS Secrets Manager)

```typescript
// utils/secretsManager.ts
import * as AWS from "aws-sdk";

const secretsManager = new AWS.SecretsManager();

export async function getSecret(secretName: string): Promise<string> {
  try {
    const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
    return data.SecretString || "";
  } catch (error) {
    console.error(`Failed to retrieve secret: ${secretName}`, error);
    throw error;
  }
}
```

#### Option 3: Managed Service (Vercel, Render)

Use dashboard to set environment variables:

```
PRIVATE_KEY = 0x...
DATABASE_URL = postgresql://...
```

---

## Configuration Loading

### Environment Configuration Module

```typescript
// src/config/index.ts
import dotenv from "dotenv";

// Load .env file
dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

// Load .env.local for overrides
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: ".env.local", override: true });
}

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),
  backendUrl: process.env.BACKEND_URL || "http://localhost:3000",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  // Database
  databaseUrl: process.env.DATABASE_URL || "mongodb://localhost:27017/africoin",

  // Blockchain
  baseSepolia: {
    rpc: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
    privateKey: process.env.PRIVATE_KEY || "",
  },

  // Web3Auth
  web3Auth: {
    clientId: process.env.WEB3AUTH_CLIENT_ID || "",
    network: (process.env.WEB3AUTH_NETWORK || "testnet") as "testnet" | "mainnet",
  },

  // Africa's Talking
  africasTalking: {
    apiKey: process.env.AFRICAS_TALKING_API_KEY || "",
    username: process.env.AFRICAS_TALKING_USERNAME || "",
    shortCode: process.env.AFRICAS_TALKING_SHORTCODE || "888",
  },

  // Authentication
  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret-change-this",
    expiresIn: process.env.JWT_EXPIRY || "7d",
  },

  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "10", 10),

  // External APIs
  huggingFace: {
    apiKey: process.env.HUGGING_FACE_API_KEY || "",
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  // Sentry
  sentry: {
    dsn: process.env.SENTRY_DSN || "",
  },

  // Logging
  logger: {
    level: process.env.LOG_LEVEL || "info",
  },

  // CORS
  cors: {
    origin: (process.env.CORS_ORIGIN || "http://localhost:5173").split(","),
  },

  // Feature flags
  features: {
    voiceEnabled: process.env.FEATURE_VOICE !== "false",
    ussdEnabled: process.env.FEATURE_USSD !== "false",
    daoEnabled: process.env.FEATURE_DAO !== "false",
  },
};

// Validation
export function validateConfig() {
  const required = [
    "nodeEnv",
    "port",
    "databaseUrl",
    "baseSepolia.rpc",
    "web3Auth.clientId",
    "africasTalking.apiKey",
    "jwt.secret",
  ];

  for (const key of required) {
    const value = key.split(".").reduce((obj: any, k) => obj?.[k], config);
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}
```

### Usage in Code

```typescript
// src/index.ts
import { config, validateConfig } from "./config";

// Validate on startup
try {
  validateConfig();
  console.log(`✓ Configuration validated for ${config.nodeEnv} environment`);
} catch (error) {
  console.error("Configuration validation failed:", error);
  process.exit(1);
}

// Use in application
const app = express();

app.use(cors({ origin: config.cors.origin }));

// Connect to database
connectDB(config.databaseUrl);
```

---

## Local Development

### Initial Setup

```bash
# 1. Copy example file
cp .env.example .env.development
cp .env.example .env.test

# 2. Create local overrides (never commit)
touch .env.local

# 3. Edit .env.local with your local values
nano .env.local

# 4. Verify configuration
npm run config:validate
```

### .env.local Example

```bash
# Override only what you need locally
PRIVATE_KEY=your_dev_account_private_key
WEB3AUTH_CLIENT_ID=your_local_client_id
AFRICAS_TALKING_API_KEY=your_sandbox_key

# Optional local MongoDB
DATABASE_URL=mongodb://localhost:27017/africoin-dev

# Local Redis (if using job queues)
REDIS_URL=redis://localhost:6379
```

### .gitignore Configuration

```bash
# .gitignore
.env
.env.local
.env.production
.env.*.local

# Don't commit private keys or secrets
*.pem
*.key
secrets/
vault/
```

---

## Configuration Validation

Add a configuration validation script:

```typescript
// scripts/validate-config.ts
import { config, validateConfig } from "../src/config";

try {
  validateConfig();
  console.log("✓ Configuration is valid");
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Port: ${config.port}`);
  console.log(`Database: ${config.databaseUrl.split("@")[1] || "local"}`);
  console.log(`Blockchain: Base Sepolia`);
  process.exit(0);
} catch (error) {
  console.error("✗ Configuration validation failed:", error);
  process.exit(1);
}
```

Run validation:

```bash
npm run config:validate
```

---

## Environment-Specific Documentation

### Development
- Use localhost URLs
- Connect to local/dev MongoDB
- Use testnet blockchain
- Enable verbose logging

### Testing
- Use in-memory or test databases
- Use local blockchain (Hardhat node)
- Disable external API calls (mock instead)
- Disable email/SMS sending

### Production
- Use HTTPS URLs
- Connect to managed database service
- Use mainnet blockchain
- Enable monitoring and alerting
- Use secrets vault for sensitive data
- Minimal logging (warn/error only)

---

## Next Steps

1. ✅ Create `.env.development` and `.env.test`
2. ✅ Setup `.env.local` for local secrets
3. ✅ Implement `config/index.ts` module
4. ✅ Add validation checks
5. Move to [Frontend PWA Development Guide](./05-frontend-setup.md)

---

**Last Updated:** October 19, 2025  
**Status:** Ready for Development
