# AfriCoin Project - Complete Setup Guide

Welcome to AfriCoin! This document provides an overview of the project structure and guides you through getting started.

## 🚀 Quick Start

### Prerequisites

- Node.js 16.x or higher
- pnpm or yarn
- Git
- MongoDB or PostgreSQL (for database)
- Private keys for testing (optional for MVP)

### Initial Setup

```bash
# Clone the repository
git clone <repository_url>
cd AfriCoin

# Install root dependencies
pnpm install

# Install workspace dependencies
pnpm run install:all

# Setup environment variables
cp apps/backend/.env.example apps/backend/.env.development
cp apps/frontend/.env.example apps/frontend/.env.development

# Start development
pnpm run dev
```

---

## 📁 Project Structure

```
AfriCoin/
├── apps/
│   ├── frontend/               # React + Vite PWA
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   ├── pages/          # Page routes
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── utils/          # Helper functions
│   │   │   ├── locales/        # i18n translations
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── public/             # Static assets
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── backend/                # Node.js + Express API
│   │   ├── src/
│   │   │   ├── controllers/    # API request handlers
│   │   │   ├── services/       # Business logic
│   │   │   ├── models/         # Database schemas
│   │   │   ├── routes/         # API routes
│   │   │   ├── utils/          # Helper utilities
│   │   │   ├── middleware/     # Express middleware
│   │   │   └── index.ts        # Server entry
│   │   ├── test/               # Test files
│   │   └── package.json
│   │
│   └── ai-engine/              # Python microservice
│       ├── src/
│       │   ├── rebalancer.py   # Stability algorithm
│       │   └── app.py          # FastAPI server
│       ├── requirements.txt
│       └── Dockerfile
│
├── packages/
│   ├── contracts/              # Solidity smart contracts
│   │   ├── contracts/
│   │   │   ├── AfriCoin.sol    # ERC-20 token
│   │   │   ├── AfriDAO.sol     # DAO governance
│   │   │   └── mocks/
│   │   ├── scripts/            # Deploy scripts
│   │   ├── test/               # Contract tests
│   │   ├── hardhat.config.ts
│   │   └── package.json
│   │
│   └── shared/                 # Shared utilities
│       ├── types/              # Shared TypeScript types
│       └── utils/              # Common functions
│
├── docs/
│   ├── AfriCoin Product Requirements Document (PRD).md
│   ├── milestones/
│   │   └── MILESTONES.md       # Project roadmap
│   └── development/            # Development guides
│       ├── 01-smart-contracts-setup.md
│       ├── 02-backend-setup.md
│       ├── 03-database-schema.md
│       ├── 04-environment-setup.md
│       ├── 05-frontend-setup.md
│       ├── 06-web3auth-integration.md
│       ├── 07-ussd-integration.md
│       ├── 08-i18n-setup.md
│       ├── 09-llm-integration.md
│       ├── 10-voice-integration.md
│       ├── 11-ai-stability-engine.md
│       ├── 12-python-microservice.md
│       ├── 13-testing-strategy.md
│       ├── 14-security-audit.md
│       ├── 15-performance-optimization.md
│       └── 16-deployment-checklist.md
│
├── turbo.json                  # Turborepo config
├── package.json                # Root package config
├── .gitignore
└── README.md                   # This file
```

---

## 📚 Documentation

### Project Planning

- **[Product Requirements Document](./docs/AfriCoin%20Product%20Requirements%20Document%20(PRD).md)** - Complete project specification
- **[Milestones & Roadmap](./docs/milestones/MILESTONES.md)** - 4-week development timeline

### Development Guides

#### Milestone 1: Foundation & Infrastructure
- [Smart Contracts Setup](./docs/development/01-smart-contracts-setup.md)
- [Backend API Setup](./docs/development/02-backend-setup.md)
- [Database Schema Design](./docs/development/03-database-schema.md)
- [Environment Configuration](./docs/development/04-environment-setup.md)

#### Milestone 2: Core Features & PWA
- [Frontend PWA Development](./docs/development/05-frontend-setup.md)
- [Web3Auth Integration](./docs/development/06-web3auth-integration.md)
- [USSD Integration](./docs/development/07-ussd-integration.md)
- [Internationalization (i18n)](./docs/development/08-i18n-setup.md)

#### Milestone 3: AI & Advanced Features
- [Swahili LLM Integration](./docs/development/09-llm-integration.md)
- [Voice Integration](./docs/development/10-voice-integration.md)
- [AI Stability Engine](./docs/development/11-ai-stability-engine.md)
- [Python Microservice Setup](./docs/development/12-python-microservice.md)

#### Milestone 4: Testing & Deployment
- [Testing Strategy](./docs/development/13-testing-strategy.md)
- [Security Audit](./docs/development/14-security-audit.md)
- [Performance Optimization](./docs/development/15-performance-optimization.md)
- [Deployment Checklist](./docs/development/16-deployment-checklist.md)

---

## 🏗️ Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** TanStack Query + Context API
- **Wallet Integration:** Web3Auth (MPC wallets)
- **Blockchain Interaction:** Web3.js / Ethers.js
- **i18n:** i18next (Swahili, English, French)
- **PWA:** Service Workers, Workbox

### Backend
- **Runtime:** Node.js 16+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose) or PostgreSQL (Prisma)
- **Authentication:** JWT + MPC wallets
- **Task Queue:** BullMQ + Redis
- **Payment Gateway:** Africa's Talking (USSD/SMS)
- **LLM Integration:** Hugging Face Inference API

### Smart Contracts
- **Language:** Solidity 0.8.x
- **Chain:** Base Sepolia Testnet (EVM L2)
- **Development:** Hardhat
- **Testing:** Chai + Ethers.js
- **Standards:** OpenZeppelin (ERC-20, Governor)

### AI/ML
- **Framework:** Python 3.9+
- **API:** FastAPI
- **ML Libraries:** scikit-learn, Pandas, NumPy
- **LLM:** Mistral 7B or GPT-3.5-turbo
- **Voice:** Web Speech API + Google Cloud Speech

### DevOps
- **Monorepo:** Turborepo
- **Version Control:** Git + GitHub
- **CI/CD:** GitHub Actions
- **Code Quality:** ESLint, Prettier, TypeScript strict mode
- **Testing:** Jest, Vitest, Cypress
- **Deployment:** Vercel (Frontend), Render/Heroku (Backend)

---

## 🎯 Getting Started by Role

### Frontend Developer

1. Read: [Frontend PWA Development Guide](./docs/development/05-frontend-setup.md)
2. Setup: `cd apps/frontend && npm install`
3. Start: `pnpm run dev`
4. Explore components in `src/components/` and `src/pages/`

### Backend Developer

1. Read: [Backend API Setup Guide](./docs/development/02-backend-setup.md)
2. Setup: `cd apps/backend && npm install`
3. Configure: Create `.env.development` from `.env.example`
4. Start: `pnpm run dev`
5. API runs on `http://localhost:3000`

### Smart Contract Developer

1. Read: [Smart Contracts Setup Guide](./docs/development/01-smart-contracts-setup.md)
2. Setup: `cd packages/contracts && npm install`
3. Compile: `pnpm run compile`
4. Test: `pnpm run test`
5. Deploy: `pnpm run deploy:sepolia`

### AI/ML Developer

1. Read: [LLM Integration](./docs/development/09-llm-integration.md) & [Voice Integration](./docs/development/10-voice-integration.md)
2. Implement intent classification and entity extraction
3. Train on Swahili dataset
4. Integrate with backend API

---

## 🚦 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

```bash
# Edit files in relevant app (frontend/backend/contracts)
```

### 3. Test Locally

```bash
# Run tests for your workspace
pnpm run test

# Or specific workspace
pnpm run test --filter=@africoin/frontend
```

### 4. Format & Lint

```bash
pnpm run format
pnpm run lint
```

### 5. Commit & Push

```bash
git add .
git commit -m "feat: description of your changes"
git push origin feature/your-feature-name
```

### 6. Create Pull Request

Document your changes and request review.

---

## 📝 Environment Variables

### Frontend (.env.development)

```bash
VITE_API_URL=http://localhost:3000/api
VITE_WEB3AUTH_CLIENT_ID=your_client_id
```

### Backend (.env.development)

```bash
PORT=3000
DATABASE_URL=mongodb://localhost:27017/africoin
BASE_SEPOLIA_RPC=https://sepolia.base.org
AFRICAS_TALKING_API_KEY=your_api_key
JWT_SECRET=your_secret
```

See [Environment Setup Guide](./docs/development/04-environment-setup.md) for complete configuration.

---

## 🧪 Testing

### Run All Tests

```bash
pnpm run test
```

### Test Specific Workspace

```bash
pnpm run test --filter=@africoin/backend
pnpm run test --filter=@africoin/frontend
pnpm run test --filter=@africoin/contracts
```

### Coverage Report

```bash
pnpm run test:coverage
```

---

## 🔗 Useful Links

- **Base Network:** https://base.org/
- **Web3Auth Documentation:** https://web3auth.io/docs/
- **Africa's Talking:** https://africastalking.com/
- **Hardhat:** https://hardhat.org/
- **React Documentation:** https://react.dev/
- **Express.js:** https://expressjs.com/

---

## 🤝 Contributing

1. Read contributing guidelines (if available)
2. Create feature branch from `main`
3. Make changes with descriptive commits
4. Ensure tests pass
5. Submit pull request with clear description

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000 (backend)
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### Database Connection Issues

```bash
# Check MongoDB is running
mongosh

# Or PostgreSQL
psql -h localhost
```

### Wallet Connection Issues

- Ensure MetaMask or Web3Auth is installed
- Check network is set to Base Sepolia
- Verify contract address is correct

### LLM API Issues

- Check Hugging Face API key is valid
- Verify network connectivity
- Check rate limits

---

## 📊 Project Status

| Milestone | Status | Due Date |
|-----------|--------|----------|
| Foundation & Infrastructure | ⏳ Not Started | Day 5 |
| Core Features & PWA | ⏳ Not Started | Day 12 |
| AI & Advanced Features | ⏳ Not Started | Day 20 |
| Testing & Deployment | ⏳ Not Started | Day 30 |

---

## 📞 Support

- **Documentation:** See `docs/` folder
- **Issues:** Create GitHub issue with details
- **Discussions:** Use GitHub Discussions
- **Team:** Contact project lead

---

## 📄 License

Specify your project license here (MIT, Apache 2.0, etc.)

---

## 🎉 Happy Coding!

Start with reading the [Milestones & Roadmap](./docs/milestones/MILESTONES.md) to understand the project timeline, then dive into the relevant development guide for your role.

**Good luck building AfriCoin! 🚀**

---

**Last Updated:** October 19, 2025  
**Maintained By:** AfriCoin Development Team
