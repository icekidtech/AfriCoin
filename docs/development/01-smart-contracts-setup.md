# Smart Contract Development Guide

**Related Milestone:** [Milestone 1: Foundation & Infrastructure](../milestones/MILESTONES.md#milestone-1-foundation--infrastructure)

## Overview

This document provides a comprehensive guide for setting up and developing the smart contracts for AfriCoin using Hardhat on the Base Sepolia Testnet.

## Table of Contents

1. [Setup](#setup)
2. [Project Structure](#project-structure)
3. [Core Contracts](#core-contracts)
4. [Development Workflow](#development-workflow)
5. [Testing](#testing)
6. [Deployment](#deployment)

---

## Setup

### Prerequisites

- Node.js >= 16.x
- npm or yarn
- Git

### Installation Steps

```bash
# Navigate to contracts directory
cd packages/contracts

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

### Environment Configuration

Create `.env` file in `packages/contracts/`:

```bash
PRIVATE_KEY=your_private_key_here
BASE_SEPOLIA_RPC=https://sepolia.base.org
ETHERSCAN_API_KEY=your_etherscan_key
```

---

## Project Structure

```
packages/contracts/
├── contracts/
│   ├── AfriCoin.sol           # Main ERC-20 stablecoin token
│   ├── AfriDAO.sol            # DAO governance contract
│   ├── StabilityEngine.sol    # Reserve management (optional)
│   └── mocks/
│       └── MockOracle.sol     # Chainlink oracle mock
├── scripts/
│   ├── deploy.ts              # Deployment script
│   └── verify.ts              # Contract verification script
├── test/
│   ├── AfriCoin.test.ts
│   ├── AfriDAO.test.ts
│   └── integration/
│       └── flows.test.ts       # End-to-end flows
├── hardhat.config.ts          # Hardhat configuration
├── tsconfig.json              # TypeScript configuration
└── package.json
```

---

## Core Contracts

### 1. AfriCoin.sol (ERC-20 Token)

**Purpose:** Main stablecoin token contract

**Key Features:**
- ERC-20 standard implementation
- Mint/burn functionality (controlled by owner)
- Pause mechanism for emergencies
- Burnable tokens

**Example Interface:**
```solidity
contract AfriCoin is ERC20, Ownable, Pausable, Burnable {
    uint8 private constant DECIMALS = 18;
    
    constructor() ERC20("AfriCoin", "AFRI") {}
    
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}
```

**Deployment Considerations:**
- Set initial supply
- Configure owner and admin roles
- Test pause/unpause functionality

### 2. AfriDAO.sol (Governance)

**Purpose:** Decentralized governance for protocol decisions

**Key Features:**
- Governor pattern (OpenZeppelin)
- Token-based voting
- Timelock for security
- Treasury management

**Example Interface:**
```solidity
contract AfriDAO is Governor, GovernorSettings, GovernorCountingSimple {
    constructor(IVotes _token) Governor("AfriDAO") {
        // Initialize voting parameters
    }
    
    function votingDelay() public pure override returns (uint256) {
        return 1; // 1 block
    }
    
    function votingPeriod() public pure override returns (uint256) {
        return 45818; // 1 week on Base
    }
}
```

**Governance Parameters:**
- Voting delay: 1 block
- Voting period: 1 week
- Proposal threshold: Configurable
- Quorum: Configurable

### 3. StabilityEngine.sol (Optional)

**Purpose:** Reserve basket management and rebalancing triggers

**Key Features:**
- Reserve tracking
- Rebalancing thresholds
- Price feed integration

---

## Development Workflow

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm run test
```

### Run with Coverage

```bash
npm run test:coverage
```

### Local Development

```bash
# Start local Hardhat node
npm run node

# In another terminal, run scripts against local node
HARDHAT_NETWORK=localhost npm run deploy
```

---

## Testing

### Test Structure

Each contract should have corresponding test files using Hardhat + Chai:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("AfriCoin", function () {
  let afriCoin: AfriCoin;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;

  beforeEach(async () => {
    [owner, addr1] = await ethers.getSigners();
    const AfriCoin = await ethers.getContractFactory("AfriCoin");
    afriCoin = await AfriCoin.deploy();
    await afriCoin.deployed();
  });

  it("Should mint tokens", async () => {
    const amount = ethers.utils.parseEther("100");
    await afriCoin.mint(addr1.address, amount);
    expect(await afriCoin.balanceOf(addr1.address)).to.equal(amount);
  });
});
```

### Test Coverage Goals

- Unit tests: >90% coverage
- Critical path: 100% coverage
- Edge cases: All important scenarios

---

## Deployment

### Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed
- [ ] Security audit completed
- [ ] Gas optimization verified
- [ ] Environment variables set

### Deploy to Base Sepolia

```bash
# Deploy to Sepolia testnet
npm run deploy:sepolia

# Verify on Etherscan
npm run verify:sepolia
```

### Deployment Script Template

```typescript
import { ethers } from "hardhat";

async function main() {
  const AfriCoin = await ethers.getContractFactory("AfriCoin");
  const afriCoin = await AfriCoin.deploy();
  await afriCoin.deployed();
  
  console.log("AfriCoin deployed to:", afriCoin.address);
  
  // Save addresses for frontend
  const addresses = {
    afariCoin: afriCoin.address,
  };
  console.log(JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### Contract Verification

After deployment, verify contracts on Etherscan:

```bash
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

---

## Key Configuration Files

### hardhat.config.ts

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC || "",
      accounts: [process.env.PRIVATE_KEY || ""],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
};

export default config;
```

---

## Common Issues & Solutions

### Issue: Contract not compiling

**Solution:** Check Solidity version in `hardhat.config.ts` matches contract pragma

### Issue: Deployment fails with "insufficient funds"

**Solution:** Ensure test account has testnet ETH (use testnet faucets)

### Issue: Contract verification fails

**Solution:** Ensure constructor arguments match exactly; use encoded format

---

## Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/4.x/)
- [Base Network Docs](https://docs.base.org/)
- [Solidity Best Practices](https://docs.soliditylang.org/)

---

## Next Steps

1. ✅ Setup project structure
2. ✅ Write core contracts
3. ✅ Complete unit tests
4. ✅ Deploy to testnet
5. Move to [Backend API Setup Guide](./02-backend-setup.md)

---

**Last Updated:** October 19, 2025  
**Status:** Ready for Development
