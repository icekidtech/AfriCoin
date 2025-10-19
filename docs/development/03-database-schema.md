# Database Schema Design

**Related Milestone:** [Milestone 1: Foundation & Infrastructure](../milestones/MILESTONES.md#milestone-1-foundation--infrastructure)

## Overview

This document outlines the database schema design for AfriCoin, supporting user wallets, transactions, and governance.

## Table of Contents

1. [Data Models](#data-models)
2. [Database Choice](#database-choice)
3. [Schema Definitions](#schema-definitions)
4. [Relationships](#relationships)
5. [Indexing Strategy](#indexing-strategy)
6. [Migrations](#migrations)

---

## Data Models

The AfriCoin system uses the following core entities:

| Entity | Purpose | Relationships |
|--------|---------|---------------|
| User | User profile and wallet identity | 1:N with Transactions |
| Transaction | Fund transfers between users | N:1 with User |
| ReserveBasket | Reserve state for stability | 1:1 system-wide |
| GovernanceProposal | DAO proposals | 1:N with Votes |
| Vote | DAO voting records | N:1 with GovernanceProposal |

---

## Database Choice

### Recommended: MongoDB with Mongoose

**Advantages:**
- Flexible schema for evolving requirements
- Natural JSON/document structure
- Easy to scale horizontally
- Good for rapid prototyping

**Alternative: PostgreSQL with Prisma**

**Advantages:**
- Strong ACID guarantees
- Complex queries
- Referential integrity

### Setup

#### MongoDB (Recommended for MVP)

```bash
# Installation
npm install mongoose

# Connection string
MONGODB_URI=mongodb://localhost:27017/africoin
# Or Atlas:
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/africoin
```

#### PostgreSQL

```bash
# Installation
npm install prisma @prisma/client
npx prisma init
```

---

## Schema Definitions

### 1. User Schema

Represents a user and their wallet

```typescript
// models/User.ts
import { Schema, Document, model } from "mongoose";

interface IUser extends Document {
  phoneHash: string;           // SHA-256 hash of phone number
  name: string;
  pinHash: string;             // Hashed PIN (bcrypt)
  walletAddress: string;       // Blockchain wallet address
  balance: BigInt;             // AfriCoin balance in wei
  status: "active" | "suspended" | "deleted";
  email?: string;
  kyc: {
    verified: boolean;
    tier: 1 | 2 | 3;          // 1: basic, 2: verified, 3: premium
    updatedAt?: Date;
  };
  limits: {
    dailyLimit: BigInt;        // Daily transfer limit in wei
    dailyUsed: BigInt;
    monthlyLimit: BigInt;
    monthlyUsed: BigInt;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    phoneHash: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    pinHash: { type: String, required: true },
    walletAddress: { type: String, required: true, unique: true },
    balance: { type: BigInt, default: 0n },
    status: { type: String, enum: ["active", "suspended", "deleted"], default: "active" },
    email: { type: String },
    kyc: {
      verified: { type: Boolean, default: false },
      tier: { type: Number, enum: [1, 2, 3], default: 1 },
      updatedAt: { type: Date },
    },
    limits: {
      dailyLimit: { type: BigInt, default: 100000000000000000n }, // 1 AFRI
      dailyUsed: { type: BigInt, default: 0n },
      monthlyLimit: { type: BigInt, default: 1000000000000000000n }, // 10 AFRI
      monthlyUsed: { type: BigInt, default: 0n },
    },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
```

### 2. Transaction Schema

Represents fund transfers

```typescript
// models/Transaction.ts
interface ITransaction extends Document {
  transactionHash?: string;    // Blockchain tx hash
  fromPhoneHash: string;       // Sender phone hash
  toPhoneHash: string;         // Recipient phone hash
  fromAddress: string;         // Sender wallet address
  toAddress: string;           // Recipient wallet address
  amount: BigInt;              // Amount in wei
  amountInLocalCurrency?: number;  // Amount in local currency
  currency?: string;           // Local currency code (KES, NGN, etc)
  fxRate?: number;             // FX rate at time of transaction
  type: "send" | "receive" | "topup" | "cashout";
  status: "pending" | "completed" | "failed" | "reversed";
  metadata: {
    source?: string;           // mobile_money, bank, etc
    destination?: string;
    description?: string;
    voiceCommand?: boolean;    // Was this a voice command
  };
  errorMessage?: string;       // If failed
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    transactionHash: { type: String, sparse: true },
    fromPhoneHash: { type: String, required: true, index: true },
    toPhoneHash: { type: String, required: true, index: true },
    fromAddress: { type: String, required: true },
    toAddress: { type: String, required: true },
    amount: { type: BigInt, required: true },
    amountInLocalCurrency: { type: Number },
    currency: { type: String },
    fxRate: { type: Number },
    type: { type: String, enum: ["send", "receive", "topup", "cashout"], required: true },
    status: { type: String, enum: ["pending", "completed", "failed", "reversed"], default: "pending" },
    metadata: {
      source: { type: String },
      destination: { type: String },
      description: { type: String },
      voiceCommand: { type: Boolean, default: false },
    },
    errorMessage: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const Transaction = model<ITransaction>("Transaction", transactionSchema);
```

### 3. ReserveBasket Schema

Tracks reserve composition for stability

```typescript
// models/ReserveBasket.ts
interface IReserveBasket extends Document {
  totalReserve: BigInt;        // Total reserve in wei
  currencies: {
    [key: string]: number;     // Currency code -> amount (e.g., ZAR, NGN)
  };
  commodities: {
    [key: string]: number;     // Commodity -> amount (e.g., gold, oil)
  };
  targetAllocation: {
    currencies: { [key: string]: number };
    commodities: { [key: string]: number };
  };
  rebalancingThreshold: number; // Rebalance if deviation > this %
  lastRebalance: Date;
  nextScheduledRebalance: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reserveBasketSchema = new Schema<IReserveBasket>(
  {
    totalReserve: { type: BigInt, required: true, default: 0n },
    currencies: { type: Map, of: Number, default: new Map() },
    commodities: { type: Map, of: Number, default: new Map() },
    targetAllocation: {
      currencies: { type: Map, of: Number },
      commodities: { type: Map, of: Number },
    },
    rebalancingThreshold: { type: Number, default: 10 }, // 10%
    lastRebalance: { type: Date },
    nextScheduledRebalance: { type: Date },
  },
  { timestamps: true }
);

export const ReserveBasket = model<IReserveBasket>("ReserveBasket", reserveBasketSchema);
```

### 4. GovernanceProposal Schema

DAO proposals for governance

```typescript
// models/GovernanceProposal.ts
interface IGovernanceProposal extends Document {
  proposalId: number;
  title: string;
  description: string;
  proposer: string;
  status: "active" | "canceled" | "executed" | "failed";
  votingStart: Date;
  votingEnd: Date;
  forVotes: BigInt;
  againstVotes: BigInt;
  abstainVotes: BigInt;
  targets: string[];
  calldatas: string[];
  description_hash: string;
  createdAt: Date;
}

const governanceProposalSchema = new Schema<IGovernanceProposal>(
  {
    proposalId: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    proposer: { type: String, required: true },
    status: { type: String, enum: ["active", "canceled", "executed", "failed"], required: true },
    votingStart: { type: Date, required: true },
    votingEnd: { type: Date, required: true },
    forVotes: { type: BigInt, default: 0n },
    againstVotes: { type: BigInt, default: 0n },
    abstainVotes: { type: BigInt, default: 0n },
    targets: [String],
    calldatas: [String],
    description_hash: { type: String },
  },
  { timestamps: true }
);

export const GovernanceProposal = model<IGovernanceProposal>(
  "GovernanceProposal",
  governanceProposalSchema
);
```

### 5. Vote Schema

Individual votes on proposals

```typescript
// models/Vote.ts
interface IVote extends Document {
  proposalId: number;
  voter: string;
  support: 0 | 1 | 2;         // 0: against, 1: for, 2: abstain
  weight: BigInt;
  reason?: string;
  createdAt: Date;
}

const voteSchema = new Schema<IVote>(
  {
    proposalId: { type: Number, required: true, index: true },
    voter: { type: String, required: true },
    support: { type: Number, enum: [0, 1, 2], required: true },
    weight: { type: BigInt, required: true },
    reason: { type: String },
  },
  { timestamps: true }
);

export const Vote = model<IVote>("Vote", voteSchema);
```

---

## Relationships

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────┐
│ User                                        │
│ ┌─────────────────────────────────────────┐ │
│ │ phoneHash (PK)                          │ │
│ │ name                                    │ │
│ │ walletAddress                           │ │
│ │ balance                                 │ │
│ │ ...                                     │ │
│ └─────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────┘
                   │ 1:N
                   ▼
┌─────────────────────────────────────────────┐
│ Transaction                                 │
│ ┌─────────────────────────────────────────┐ │
│ │ _id (PK)                                │ │
│ │ fromPhoneHash (FK)                      │ │
│ │ toPhoneHash (FK)                        │ │
│ │ amount                                  │ │
│ │ status                                  │ │
│ │ ...                                     │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ReserveBasket (singleton)                   │
│ ┌─────────────────────────────────────────┐ │
│ │ _id (PK)                                │ │
│ │ totalReserve                            │ │
│ │ currencies                              │ │
│ │ commodities                             │ │
│ │ ...                                     │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ GovernanceProposal                          │
│ ┌─────────────────────────────────────────┐ │
│ │ proposalId (PK)                         │ │
│ │ title                                   │ │
│ │ proposer                                │ │
│ │ ...                                     │ │
│ └─────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────┘
                   │ 1:N
                   ▼
┌─────────────────────────────────────────────┐
│ Vote                                        │
│ ┌─────────────────────────────────────────┐ │
│ │ _id (PK)                                │ │
│ │ proposalId (FK)                         │ │
│ │ voter                                   │ │
│ │ support                                 │ │
│ │ ...                                     │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## Indexing Strategy

Indexes improve query performance for frequently accessed fields:

```typescript
// Indexes for User collection
userSchema.index({ phoneHash: 1 });           // Fast lookup by phone
userSchema.index({ walletAddress: 1 });       // Fast lookup by wallet
userSchema.index({ createdAt: -1 });          // Time-based queries
userSchema.index({ status: 1, createdAt: -1 }); // Compound index

// Indexes for Transaction collection
transactionSchema.index({ fromPhoneHash: 1 });
transactionSchema.index({ toPhoneHash: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ fromPhoneHash: 1, createdAt: -1 }); // Get user's recent txns
transactionSchema.index({ transactionHash: 1 }, { sparse: true }); // Blockchain tx lookup

// Indexes for GovernanceProposal collection
governanceProposalSchema.index({ proposalId: 1 });
governanceProposalSchema.index({ status: 1 });
governanceProposalSchema.index({ votingEnd: 1 });

// Indexes for Vote collection
voteSchema.index({ proposalId: 1, voter: 1 }, { unique: true }); // Prevent double voting
voteSchema.index({ proposalId: 1 });
```

---

## Migrations

### Using MongoDB (Mongoose)

No explicit migrations needed for MongoDB, but maintain version tracking:

```typescript
// models/SchemaMigration.ts
const schemaMigrationSchema = new Schema({
  version: { type: String, required: true, unique: true },
  executedAt: { type: Date, default: Date.now },
  description: String,
});
```

### Using PostgreSQL (Prisma)

```bash
# Create migration
npx prisma migrate dev --name add_user_table

# Apply migrations
npx prisma migrate deploy

# Rollback
npx prisma migrate resolve --rolled-back <migration_name>
```

### Sample Prisma Schema

```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  phoneHash String   @unique
  name      String
  pinHash   String
  wallet    String   @unique
  balance   BigInt   @default(0)
  status    String   @default("active")
  
  transactions_from Transaction[] @relation("sender")
  transactions_to   Transaction[] @relation("recipient")
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Transaction {
  id        String   @id @default(cuid())
  sender    User     @relation("sender", fields: [senderId], references: [id])
  senderId  String
  recipient User     @relation("recipient", fields: [recipientId], references: [id])
  recipientId String
  amount    BigInt
  status    String   @default("pending")
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Best Practices

1. **Hashing:** Always hash phone numbers with SHA-256/Keccak256
2. **BigInt:** Use BigInt for values in wei to maintain precision
3. **Indexing:** Index frequently queried fields
4. **Timestamps:** Always include `createdAt` and `updatedAt`
5. **Validation:** Validate data at schema level when possible
6. **Backup:** Regular backups for production databases

---

## Next Steps

1. ✅ Design schema
2. ✅ Setup ORM (Mongoose/Prisma)
3. ✅ Create models
4. ✅ Setup migrations
5. Move to [Environment Configuration](./04-environment-setup.md)

---

**Last Updated:** October 19, 2025  
**Status:** Ready for Development
