# AfriCoin Frontend - PWA Development

Welcome to the AfriCoin frontend application! This is a Progressive Web App (PWA) built with React, TypeScript, and Vite, designed for seamless cryptocurrency transactions in Africa.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   cd apps/frontend
   pnpm install
   ```

2. **Start development server:**
   ```bash
   pnpm run dev
   ```

3. **Build for production:**
   ```bash
   pnpm run build
   ```

4. **Preview production build:**
   ```bash
   pnpm run preview
   ```

## 📁 Project Structure

```
apps/frontend/
├── src/
│   ├── components/
│   │   ├── ui/                 # Reusable UI components (shadcn/ui)
│   │   ├── WalletCard.tsx      # Wallet balance display
│   │   ├── TransactionList.tsx # Transaction history
│   │   ├── SendForm.tsx        # Send money form
│   │   ├── ReceiveModal.tsx    # Receive address modal
│   │   ├── VoiceButton.tsx     # Voice command button
│   │   └── Layout.tsx          # App layout
│   ├── pages/
│   │   ├── Onboarding.tsx      # User onboarding
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── Send.tsx            # Send money page
│   │   ├── Receive.tsx         # Receive money page
│   │   ├── History.tsx         # Transaction history
│   │   ├── Settings.tsx        # User settings
│   │   └── NotFound.tsx        # 404 page
│   ├── hooks/
│   │   ├── useWallet.ts        # Wallet operations
│   │   ├── useVoiceLLM.ts      # Voice command processing
│   │   ├── useTransactions.ts  # Transaction queries
│   │   └── useAuth.ts          # Authentication
│   ├── utils/
│   │   ├── api.ts              # API client
│   │   ├── phoneHash.ts        # Phone number hashing
│   │   ├── formatters.ts       # Data formatters
│   │   └── validators.ts       # Input validation
│   ├── locales/
│   │   ├── en.json             # English translations
│   │   ├── sw.json             # Swahili translations
│   │   └── fr.json             # French translations
│   ├── App.tsx                 # Root component
│   ├── main.tsx                # App entry point
│   └── App.css                 # Global styles
├── public/                     # Static assets
├── vite.config.ts              # Vite configuration
├── package.json                # Dependencies and scripts
├── pnpm-lock.yaml              # Lock file
└── README.md                   # This file
```

## 🏗️ Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** TanStack Query + Context API
- **Wallet Integration:** Web3Auth (MPC wallets)
- **Blockchain Interaction:** Web3.js / Ethers.js
- **Internationalization:** i18next (Swahili, English, French)
- **PWA Features:** Service Workers, Workbox
- **Routing:** React Router
- **Forms:** React Hook Form + Zod validation

## 🎯 Key Features

- **MPC Wallets:** Secure, non-custodial wallets via Web3Auth
- **Voice Commands:** AI-powered voice interactions for accessibility
- **Multi-language Support:** English, Swahili, French
- **USSD Integration:** Mobile money payments via Africa's Talking
- **PWA:** Installable app with offline capabilities
- **Real-time Transactions:** Live updates via WebSockets

## 📝 Environment Variables

Create a `.env.development` file in the frontend root:

```bash
VITE_API_URL=http://localhost:3000/api
VITE_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
```

See the [Environment Setup Guide](../../docs/development/04-environment-setup.md) for complete configuration.

## 🧪 Testing

Run tests with:
```bash
pnpm run test
```

## 🔗 Related Documentation

- [Frontend PWA Development Guide](../../docs/development/05-frontend-setup.md)
- [Web3Auth Integration Guide](../../docs/development/06-web3auth-integration.md)
- [Main Project README](../../README.md)

## 🤝 Contributing

1. Follow the [Development Workflow](../../README.md#🚦-development-workflow)
2. Ensure tests pass and code is linted
3. Submit a pull request with a clear description

---

**Part of AfriCoin Project** | [Main Repository](../../README.md)
