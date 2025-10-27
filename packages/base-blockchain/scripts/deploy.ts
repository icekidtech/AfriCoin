import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentAddresses {
  afriCoin: string;
  timelock: string;
  afriDAO: string;
  mockOracle: string;
  deployer: string;
  deploymentTime: string;
  network: string;
}

async function main() {
  console.log("\n🚀 Starting AfriCoin deployment to Base Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  const networkName = (await ethers.provider.getNetwork()).name;

  console.log(`📡 Network: ${networkName}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(
    `💰 Balance: ${ethers.formatEther(
      await ethers.provider.getBalance(deployer.address)
    )} ETH\n`
  );

  const addresses: DeploymentAddresses = {
    afriCoin: "",
    timelock: "",
    afriDAO: "",
    mockOracle: "",
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    network: networkName,
  };

  try {
    // Step 1: Deploy AfriCoin
    console.log("1️⃣  Deploying AfriCoin token...");
    const AfriCoinFactory = await ethers.getContractFactory("AfriCoin");
    const afriCoin = await AfriCoinFactory.deploy();
    await afriCoin.waitForDeployment();
    addresses.afriCoin = await afriCoin.getAddress();
    console.log(`   ✅ AfriCoin deployed: ${addresses.afriCoin}\n`);

    // Step 2: Deploy Mock Oracle
    console.log("2️⃣  Deploying MockOracle...");
    const MockOracleFactory = await ethers.getContractFactory("MockOracle");
    const mockOracle = await MockOracleFactory.deploy();
    await mockOracle.waitForDeployment();
    addresses.mockOracle = await mockOracle.getAddress();
    console.log(`   ✅ MockOracle deployed: ${addresses.mockOracle}\n`);

    // Optional: Mint initial tokens directly to deployer (no DAO/timelock)
    console.log("3️⃣  Minting initial AfriCoin supply to deployer (optional)...");
    try {
      const initialMint = ethers.parseEther("1000000"); // adjust if needed
      const mintTx = await afriCoin.mint(deployer.address, initialMint);
      await mintTx.wait();
      console.log(`   ✅ Minted 1,000,000 AfriCoin to deployer\n`);
    } catch (mintErr) {
      console.log("   ⚠️ Mint failed or not desired; skipping initial mint\n");
    }

    // Save addresses to JSON file
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = `${networkName}-deployment.json`;
    const filepath = path.join(deploymentsDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(addresses, null, 2));

    console.log("✅ Deployment summary:");
    console.log(JSON.stringify(addresses, null, 2));
    console.log(`\n📁 Addresses saved to: ${filepath}\n`);

    return addresses;
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
}

main();



/* 

Once you deploy, share the contract address and I can help you complete the metadata registration process.

TL;DR: After deployment, upload your 256×256px logo to Etherscan or MetaMask's token registry using your contract address. The logo won't be on-chain but will appear in wallets & explorers.

Option 1: MetaMask Token Registry (Recommended)
Create logo file:

Format: PNG, 256×256px minimum
Name: afri.png (or similar)
Save to: /public/logo/ or similar in your project
Submit to MetaMask token list:

Fork: https://github.com/MetaMask/contract-metadata
Add your token to the registry with logo
Create PR and wait for approval

Option 2: Etherscan Logo Upload
Go to your contract on Etherscan (e.g., etherscan.io/token/0x...)
Click "Update Token Info"
Upload logo (256×256px PNG)
Wait for verification

*/