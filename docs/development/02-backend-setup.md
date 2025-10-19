# Backend API Setup Guide

**Related Milestone:** [Milestone 1: Foundation & Infrastructure](../milestones/MILESTONES.md#milestone-1-foundation--infrastructure)

## Overview

This document provides a comprehensive guide for setting up and developing the Node.js/Express backend API for AfriCoin.

## Table of Contents

1. [Setup](#setup)
2. [Project Structure](#project-structure)
3. [Core API Endpoints](#core-api-endpoints)
4. [Authentication](#authentication)
5. [Error Handling](#error-handling)
6. [Development Workflow](#development-workflow)

---

## Setup

### Prerequisites

- Node.js >= 16.x
- npm or yarn
- Redis (optional, for job queuing)
- MongoDB or PostgreSQL

### Installation Steps

```bash
# Navigate to backend directory
cd apps/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

### Environment Configuration

Create `.env` file in `apps/backend/`:

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=mongodb://localhost:27017/africoin
# OR for PostgreSQL
# DATABASE_URL=postgresql://user:password@localhost:5432/africoin

# Blockchain
BASE_SEPOLIA_RPC=https://sepolia.base.org
PRIVATE_KEY=your_private_key

# Web3Auth
WEB3AUTH_CLIENT_ID=your_web3auth_client_id

# Africa's Talking
AFRICAS_TALKING_API_KEY=your_api_key
AFRICAS_TALKING_USERNAME=your_username

# JWT
JWT_SECRET=your_super_secret_key

# External APIs
CHAINLINK_RPC=https://sepolia.base.org
HUGGING_FACE_API_KEY=your_hugging_face_api_key
```

---

## Project Structure

```
apps/backend/
├── src/
│   ├── controllers/
│   │   ├── walletController.ts      # Wallet operations
│   │   ├── transferController.ts    # Transaction handling
│   │   ├── stabilityController.ts   # Rebalancing
│   │   └── voiceController.ts       # Voice/LLM operations
│   ├── services/
│   │   ├── walletService.ts         # Wallet business logic
│   │   ├── transferService.ts       # Transaction logic
│   │   ├── stabilityService.ts      # AI stability engine
│   │   ├── llmIntegrator.ts         # LLM integration
│   │   └── fxConverterService.ts    # FX conversion
│   ├── models/
│   │   ├── User.ts                  # User schema
│   │   ├── Transaction.ts           # Transaction schema
│   │   ├── ReserveBasket.ts         # Reserve data
│   │   └── WalletHistory.ts         # Wallet history
│   ├── routes/
│   │   ├── walletRoutes.ts
│   │   ├── transferRoutes.ts
│   │   ├── stabilityRoutes.ts
│   │   ├── voiceRoutes.ts
│   │   └── ussdRoutes.ts
│   ├── utils/
│   │   ├── validators.ts            # Input validation
│   │   ├── phoneHash.ts             # Phone hashing utility
│   │   ├── errorHandler.ts          # Error handling
│   │   └── logger.ts                # Logging utility
│   ├── middleware/
│   │   ├── auth.ts                  # JWT authentication
│   │   ├── errorHandler.ts          # Global error handler
│   │   └── rateLimiter.ts           # Rate limiting
│   └── index.ts                     # Server entry point
├── .env.example
├── tsconfig.json
├── package.json
└── README.md
```

---

## Core API Endpoints

### 1. Wallet Endpoints

#### POST /api/wallet/onboard

Create a new wallet for a user

**Request:**
```json
{
  "phone": "+254712345678",
  "name": "John Doe",
  "pin": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "phoneHash": "0x...",
    "walletAddress": "0x...",
    "message": "Wallet created successfully"
  }
}
```

**Implementation:**
```typescript
// walletController.ts
export const onboardUser = async (req: Request, res: Response) => {
  try {
    const { phone, name, pin } = req.body;
    
    // Validate inputs
    validatePhoneNumber(phone);
    validatePin(pin);
    
    // Hash phone
    const phoneHash = hashPhone(phone);
    
    // Create wallet with Web3Auth
    const walletAddress = await walletService.createMPCWallet(phoneHash, pin);
    
    // Save user to database
    const user = await User.create({
      phoneHash,
      name,
      pinHash: hashPin(pin),
      walletAddress,
    });
    
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    handleError(res, error);
  }
};
```

#### GET /api/wallet/balance/:phoneHash

Get wallet balance

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": "1000000000000000000",
    "decimals": 18,
    "symbol": "AFRI"
  }
}
```

#### POST /api/wallet/fund

Fund wallet with mock conversion

**Request:**
```json
{
  "phoneHash": "0x...",
  "amount": 1000,
  "currency": "KES",
  "source": "mobile_money"
}
```

### 2. Transfer Endpoints

#### POST /api/transfer/send

Send AfriCoin to another user

**Request:**
```json
{
  "senderPhoneHash": "0x...",
  "recipientPhone": "+234701234567",
  "amount": "100000000000000000",
  "pin": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionHash": "0x...",
    "status": "pending",
    "message": "Transaction submitted"
  }
}
```

#### GET /api/transfer/history/:phoneHash

Get transaction history

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "tx_001",
        "type": "send",
        "amount": "100000000000000000",
        "recipient": "0x...",
        "timestamp": "2025-10-19T10:30:00Z",
        "status": "completed"
      }
    ]
  }
}
```

### 3. Stability Endpoints

#### POST /api/stability/rebalance

Trigger rebalancing (typically cron-triggered)

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "rebalance_001",
    "status": "queued",
    "estimatedTime": "60s"
  }
}
```

#### GET /api/stability/reserve

Get current reserve basket state

**Response:**
```json
{
  "success": true,
  "data": {
    "totalReserve": "10000000000000000000",
    "currencies": {
      "ZAR": 1000000,
      "NGN": 5000000
    },
    "commodities": {
      "gold": 100
    },
    "lastRebalance": "2025-10-19T09:00:00Z"
  }
}
```

### 4. Voice/LLM Endpoints

#### POST /api/voice/process

Process voice command and return action

**Request:**
```json
{
  "audioBlob": "base64_encoded_audio",
  "language": "sw"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "intent": "send_money",
    "entities": {
      "amount": 50,
      "recipient": "+254712345678"
    },
    "confidence": 0.92
  }
}
```

### 5. USSD Endpoints

#### POST /api/ussd/callback

Handle USSD callback from Africa's Talking

**Request:**
```json
{
  "sessionId": "ATUid_...",
  "phoneNumber": "+254712345678",
  "text": "1",
  "serviceCode": "*888#"
}
```

---

## Authentication

### JWT Implementation

```typescript
// middleware/auth.ts
import jwt from "jsonwebtoken";

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
```

### PIN Authentication

```typescript
// middleware/pinAuth.ts
export const verifyPin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phoneHash, pin } = req.body;
    
    const user = await User.findOne({ phoneHash });
    if (!user) throw new Error("User not found");
    
    const pinValid = await bcrypt.compare(pin, user.pinHash);
    if (!pinValid) throw new Error("Invalid PIN");
    
    req.userId = user.id;
    next();
  } catch (error) {
    handleError(res, error);
  }
};
```

---

## Error Handling

### Global Error Handler Middleware

```typescript
// middleware/errorHandler.ts
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    success: false,
    error: {
      status,
      message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
};
```

### Custom Error Classes

```typescript
// utils/errors.ts
export class ValidationError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  status = 404;
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}
```

---

## Development Workflow

### Start Development Server

```bash
npm run dev
```

### Run Tests

```bash
npm run test
```

### Build for Production

```bash
npm run build
npm start
```

### Database Migrations

```bash
# Using Prisma
npx prisma migrate dev --name migration_name
npx prisma db push

# Or MongoDB with Mongoose
npm run db:seed
```

---

## Key Configuration Files

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Express Server Setup

```typescript
// src/index.ts
import express from "express";
import cors from "cors";
import walletRoutes from "./routes/walletRoutes";
import transferRoutes from "./routes/transferRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/wallet", walletRoutes);
app.use("/api/transfer", transferRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Best Practices

1. **Input Validation:** Always validate and sanitize inputs
2. **Error Handling:** Use consistent error responses
3. **Logging:** Log important operations for debugging
4. **Security:** Never log sensitive data (pins, keys)
5. **Rate Limiting:** Implement to prevent abuse
6. **Testing:** Write tests for critical paths

---

## Next Steps

1. ✅ Setup Express server
2. ✅ Create database models
3. ✅ Implement core endpoints
4. ✅ Add authentication
5. Move to [Database Schema Design](./03-database-schema.md)

---

**Last Updated:** October 19, 2025  
**Status:** Ready for Development
