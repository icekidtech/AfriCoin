# **AfriCoin Product Requirements Document (PRD)**

## **1\. Introduction**

### **1.1 Project Overview**

AfriCoin is a pan-African digital stablecoin designed to unify fragmented economies across the continent. It enables seamless cross-border transactions, value storage, and transfers using phone numbers as wallet identifiers, without requiring crypto literacy. The system bridges Web2 simplicity (e.g., mobile money like M-Pesa) with Web3 infrastructure on the Base blockchain (EVM-compatible L2). Key innovations include AI-driven stability pegged to a basket of African currencies and commodities, dual-mode access (PWA for smartphones, USSD for feature phones), and Swahili LLM integration for voice/multilingual commands to enhance inclusivity.

This PRD outlines the MVP for a 30-day hackathon build, focusing on core features: onboarding, funding, sending/receiving, and simulated stability. The project targets the "AI & Swahili LLM Challenge" with $10,000 prize, emphasizing LLM-driven accessibility for African communities.

### **1.2 Version History**

* Version 1.0: Initial draft (October 15, 2025\)  
* Scope: Hackathon MVP – Simulate 2-country flows (e.g., Nigeria-Kenya), no real fiat handling.

### **1.3 Stakeholders**

* Developers: Solo or small team building the prototype.  
* Users: Africans with basic/feature phones, low crypto literacy.  
* Hackathon Judges: Focus on innovation in AI/Web3 inclusivity.

## **2\. Problem Statement**

Africa's financial landscape is fragmented:

* 54 countries with 42+ currencies lead to slow, expensive, USD-dependent cross-border trade.  
* Mobile money (e.g., M-Pesa, MTN MoMo) is siloed by country.  
* DeFi exists but is inaccessible due to wallets, gas fees, and literacy barriers. Core Pain: No unified, frictionless way to trade/send/store value across borders without FX losses or middlemen.

## **3\. Vision and Goals**

### **3.1 Vision**

"One economy. One African currency. One borderless digital wallet." AfriCoin turns any phone number into a secure, AI-stable wallet for seamless pan-African transactions.

### **3.2 Goals**

* **Functional:** Enable phone-based onboarding, fiat-to-AfriCoin conversion, transfers, and cash-out.  
* **Non-Functional:** Low-latency (\<5s txns), offline-capable (USSD), multilingual (Swahili focus), secure (MPC/PIN auth).  
* **Hackathon Alignment:** Integrate Swahili LLM for voice commands (e.g., "Tuma 50 AfriCoin kwa Amina huko Kenya").  
* **Metrics for Success:** Demo end-to-end flow; simulate 100+ txns; LLM accuracy \>85% on Swahili intents.

## **4\. Target Audience and User Personas**

* **Primary Users:** Urban/rural Africans aged 18-45 using mobile money; e.g., traders sending remittances across borders.  
  * Persona 1: Amina (Kenyan shop owner) – Uses feature phone, needs simple USSD for sending to Nigerian suppliers.  
  * Persona 2: Kwame (Nigerian freelancer) – Smartphone user, wants PWA with voice in Swahili/English for quick transfers.  
* **Secondary:** Developers/hackathon audience testing the prototype.

## **5\. Features**

Prioritized for MVP (MoSCoW method: Must-Have, Should-Have, Could-Have).

### **5.1 Must-Have Features**

* **Access:** Dual-mode onboarding (PWA via React+Vite; USSD via Africa's Talking API).  
* **Identity/Security:** Phone number hashed as wallet ID; MPC wallet with 4-digit PIN signing (no seed phrases).  
* **Liquidity:** Simulated auto FX conversion (local fiat → AfriCoin → fiat) using mock APIs.  
* **AI Stability:** Smart rebalancing engine monitoring FX/inflation (PID algorithm; mock data).  
* **Inclusivity:** Voice UI with Swahili LLM (parse commands like "Send 50 AfriCoin to \+254...").  
* **Sending/Receiving:** Input recipient phone, confirm with PIN/voice, finalize on-chain; SMS notifications.  
* **Governance:** Basic AfriDAO voting mock (off-chain via Snapshot).

### **5.2 Should-Have Features**

* Offline USSD support for basic txns.  
* Multilingual UI (Swahili, English, French).

### **5.3 Could-Have Features**

* Real fiat integrations (Flutterwave/Paystack).  
* Cross-chain bridges (if time allows).

### **5.4 User Flows**

1. **Onboarding:** Dial \*888\# or open PWA → Enter name/PIN → Auto-generate MPC wallet tied to phone hash.  
2. **Funding:** Select top-up → Choose mock bank/mobile money → Convert fiat → Update balance.  
3. **Sending:** Input recipient phone (+country code) → Confirm amount → PIN/voice auth → On-chain txn.  
4. **Receiving/Cash-Out:** SMS alert → Withdraw to mock mobile money.

## **6\. Tech Stack**

Aligned with user specs: TypeScript, Hardhat, React+Vite. Full stack for MVP:

### **6.1 Frontend (PWA)**

* Framework: React \+ Vite (for fast builds/PWA support).  
* Language: TypeScript.  
* Libraries:  
  * Web3.js/Ethers.js: Blockchain interactions.  
  * Web3Auth: MPC wallets and social/phone login.  
  * @tanstack/react-query: State management/API caching.  
  * Tailwind CSS: Styling for responsive UI.  
  * i18next: Multilingual support (Swahili focus).  
* Voice/LLM: Integrate Hugging Face Inference API or OpenAI for Swahili-fine-tuned model (e.g., Llama-3 with Swahili datasets); use Web Speech API for TTS/STT.

### **6.2 Backend**

* Runtime: Node.js with TypeScript.  
* Framework: Express.js (for APIs).  
* Libraries:  
  * Ethers.js: For off-chain blockchain ops (e.g., signing).  
  * Africa's Talking SDK: USSD/SMS handling.  
  * BullMQ/Redis: Queue for async tasks (e.g., rebalancing).  
  * Prisma or Mongoose: DB ORM (SQLite/MongoDB for MVP).  
* AI/ML: Python microservice (via FastAPI) for stability engine; call via HTTP. Libraries: scikit-learn (PID/LSTM), Requests (for oracles).

### **6.3 Blockchain**

* Chain: Base Sepolia Testnet (EVM L2).  
* Development: Hardhat (testing/deployment/scripts).  
* Contracts: Solidity with TypeScript types (via TypeChain).  
* Libraries: OpenZeppelin (ERC-20, Governor for DAO).  
* Oracles: Chainlink (FX/commodity feeds).  
* AA/Wallets: Biconomy for gasless txns.

### **6.4 Database**

* Type: MongoDB (flexible for user/wallet data) or PostgreSQL (if relational needed).  
* Hosting: Local for dev; Vercel Postgres for demo.

### **6.5 Integrations**

* Payments: Flutterwave/Paystack SDKs (mock for MVP).  
* SMS/USSD: Twilio or Africa's Talking.  
* Hosting: Vercel (frontend/backend), Base testnet (contracts).

### **6.6 Dev Tools**

* Monorepo: Turborepo (manage packages: contracts, frontend, backend).  
* Testing: Jest/Vitest (unit), Cypress (E2E).  
* CI/CD: GitHub Actions.  
* Linting: ESLint, Prettier.

## **7\. Architecture and Directory Structure**

Monorepo setup with Turborepo for efficiency. High-level architecture:

* Frontend (PWA) ↔ Backend (APIs) ↔ Blockchain (Contracts via RPC).  
* AI microservice as separate for Python.  
* Data Flow: User → PWA/USSD → Backend (auth/queue) → Smart Contracts/Oracles.

### **7.1 Directory Structure**

africoin/  
├── apps/                  \# Turborepo workspaces  
│   ├── frontend/          \# React+Vite PWA  
│   │   ├── src/  
│   │   │   ├── components/  \# UI components (e.g., WalletForm.tsx)  
│   │   │   ├── pages/       \# Routes (e.g., Onboarding.tsx, Send.tsx)  
│   │   │   ├── hooks/       \# Custom hooks (e.g., useWallet.ts, useVoiceLLM.ts)  
│   │   │   ├── utils/       \# Helpers (e.g., phoneHash.ts)  
│   │   │   ├── App.tsx  
│   │   │   └── main.tsx  
│   │   ├── public/          \# Assets  
│   │   ├── vite.config.ts  
│   │   ├── tsconfig.json  
│   │   └── package.json  
│   ├── backend/           \# Node.js/Express API  
│   │   ├── src/  
│   │   │   ├── controllers/  \# API handlers (e.g., walletController.ts)  
│   │   │   ├── services/     \# Business logic (e.g., stabilityService.ts)  
│   │   │   ├── models/       \# DB schemas (e.g., User.ts)  
│   │   │   ├── routes/       \# Express routes (e.g., apiRoutes.ts)  
│   │   │   ├── utils/        \# Helpers (e.g., llmIntegrator.ts)  
│   │   │   └── index.ts      \# Server entry  
│   │   ├── tsconfig.json  
│   │   └── package.json  
│   └── ai-engine/         \# Python microservice (optional separate repo if not monorepo)  
│       ├── src/  
│       │   ├── rebalancer.py  \# PID/LSTM logic  
│       │   └── app.py         \# FastAPI server  
│       ├── requirements.txt  
│       └── Dockerfile  
├── packages/              \# Shared utilities  
│   ├── contracts/         \# Hardhat project  
│   │   ├── contracts/       \# Solidity (e.g., AfriCoin.sol, AfriDAO.sol)  
│   │   ├── scripts/         \# Deployment (e.g., deploy.ts)  
│   │   ├── test/            \# Tests (e.g., AfriCoin.test.ts)  
│   │   ├── hardhat.config.ts  
│   │   ├── typechain/       \# Generated TS types  
│   │   └── package.json  
│   └── shared/            \# TS types/utils  
│       ├── types/           \# Interfaces (e.g., Wallet.ts)  
│       └── utils/           \# Common functions (e.g., fxConverter.ts)  
├── turbo.json             \# Turborepo config  
├── .gitignore  
├── README.md  
└── package.json           \# Root

## **8\. APIs**

### **8.1 Backend APIs (Express Endpoints)**

* **Base URL:** /api  
* **Auth:** JWT or API keys for MVP.  
* Endpoints:  
  * POST /wallet/onboard: Body: { phone, name, pin } → Create MPC wallet, return hash.  
  * POST /wallet/fund: Body: { amount, source } → Simulate conversion, mint AfriCoin.  
  * POST /transfer/send: Body: { recipientPhone, amount } → Locate wallet, auth PIN, execute txn.  
  * GET /wallet/balance/:phoneHash: Return AfriCoin balance.  
  * POST /stability/rebalance: Trigger AI engine (cron-scheduled).  
  * POST /voice/process: Body: { audioBlob or text } → LLM parse (Swahili intent) → Map to action.  
* Error Handling: Standard HTTP codes, JSON responses (e.g., { error: "Invalid PIN" }).

### **8.2 External APIs**

* Chainlink: For oracles (e.g., GET FX data).  
* Africa's Talking: USSD callbacks (e.g., POST /ussd/callback).  
* Hugging Face: POST /inference for LLM.

## **9\. Data Models**

* **User:** { id: string, phoneHash: string, name: string, pinHash: string, walletAddress: string }  
* **Transaction:** { id: string, fromHash: string, toHash: string, amount: bigint, status: enum }  
* **ReserveBasket:** { currencies: { ZAR: number, NGN: number }, commodities: { gold: number } } – For stability sim.

## **10\. Security Considerations**

* Hash phones with SHA-256/keccak256.  
* MPC for keys (Web3Auth); never store seeds.  
* Rate limiting on APIs.  
* HTTPS everywhere; CORS restrictions.  
* Audit contracts with Hardhat tests.  
* Compliance: Mock KYC; note regulatory risks for real fiat (e.g., AML in Africa).

## **11\. Testing and Quality**

* Unit: Jest for TS; Hardhat for contracts.  
* Integration: Test USSD flows with simulators.  
* E2E: Cypress for PWA user journeys.  
* LLM Testing: Dataset of Swahili commands; measure intent accuracy.

## **12\. Deployment**

* Frontend: Vercel (PWA with manifest for offline).  
* Backend: Render or Heroku.  
* Contracts: Hardhat deploy to Base Sepolia.  
* AI: Vercel (if TS-ported) or Render for Python.  
* Monitoring: Sentry for errors.

## **13\. Timeline and Milestones**

* Week 1: Setup monorepo, deploy contracts, basic backend APIs.  
* Week 2: Frontend PWA, USSD integration, mock liquidity.  
* Week 3: AI/LLM voice, stability engine.  
* Week 4: Testing, governance mock, demo polish.

## **14\. Risks and Mitigations**

* **Time Overrun:** Scope to MVP; use templates (e.g., Hardhat boilerplate).  
* **LLM Accuracy:** Fallback to text input; test with open datasets.  
* **Base Congestion:** Fallback to local Ganache.  
* **Costs:** Free tiers (Vercel, Base testnet); monitor API usage.  
* **Scalability:** MVP only; profile for 100 users.

