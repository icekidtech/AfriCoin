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

    // Step 3: Deploy Timelock
    console.log("3️⃣  Deploying TimelockController...");
    const MIN_DELAY = 3600; // 1 hour
    const PROPOSER_ROLE = ethers.id("PROPOSER_ROLE");
    const EXECUTOR_ROLE = ethers.id("EXECUTOR_ROLE");

    const TimelockFactory = await ethers.getContractFactory(
      "TimelockController"
    );
    const timelock = await TimelockFactory.deploy(
      MIN_DELAY,
      [deployer.address],
      [deployer.address],
      deployer.address
    );
    await timelock.waitForDeployment();
    addresses.timelock = await timelock.getAddress();
    console.log(`   ✅ Timelock deployed: ${addresses.timelock}\n`);

    // Step 4: Delegate voting power
    // ✂️ REMOVED: delegate() call no longer available
    // console.log("4️⃣  Setting up voting power delegation...");
    // let tx = await afriCoin.delegate(deployer.address);
    // await tx.wait();
    // console.log(`   ✅ Voting power delegated to deployer\n`);

    // Step 5: Deploy AfriDAO
    console.log("4️⃣  Deploying AfriDAO governance contract...");
    const AfriDAOFactory = await ethers.getContractFactory("AfriDAO");
    const afriDAO = await AfriDAOFactory.deploy(
      await afriCoin.getAddress(),
      await timelock.getAddress()
    );
    await afriDAO.waitForDeployment();
    addresses.afriDAO = await afriDAO.getAddress();
    console.log(`   ✅ AfriDAO deployed: ${addresses.afriDAO}\n`);

    // Step 6: Grant roles to AfriDAO
    console.log("5️⃣  Granting governance roles...");
    let tx = await timelock.grantRole(PROPOSER_ROLE, addresses.afriDAO);
    await tx.wait();

    tx = await timelock.grantRole(EXECUTOR_ROLE, ethers.ZeroAddress);
    await tx.wait();
    console.log(`   ✅ Governance roles granted\n`);

    // Step 7: Mint initial tokens (optional)
    console.log("6️⃣  Minting initial AfriCoin supply...");
    const initialSupply = ethers.parseEther("1000000"); // 1 million AfriCoin
    tx = await afriCoin.mint(deployer.address, initialSupply);
    await tx.wait();
    console.log(
      `   ✅ Minted ${ethers.formatEther(initialSupply)} AfriCoin\n`
    );

    // Save addresses to file
    const deploymentDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const filename = path.join(
      deploymentDir,
      `${networkName}-${Date.now()}.json`
    );
    fs.writeFileSync(filename, JSON.stringify(addresses, null, 2));

    console.log("📋 Deployment Summary:");
    console.log("═".repeat(60));
    console.log(`AfriCoin:   ${addresses.afriCoin}`);
    console.log(`MockOracle: ${addresses.mockOracle}`);
    console.log(`Timelock:   ${addresses.timelock}`);
    console.log(`AfriDAO:    ${addresses.afriDAO}`);
    console.log("═".repeat(60));
    console.log(`\n💾 Addresses saved to: ${filename}\n`);

    return addresses;
  } catch (error) {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exitCode = 1;
  }
}

main();