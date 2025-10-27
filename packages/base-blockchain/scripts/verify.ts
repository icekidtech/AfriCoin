import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🔍 Contract Verification Utility\n");

  const deploymentDir = path.join(__dirname, "../deployments");

  if (!fs.existsSync(deploymentDir)) {
    console.error("❌ No deployment directory found");
    process.exitCode = 1;
    return;
  }

  const files = fs.readdirSync(deploymentDir).sort().reverse();
  if (files.length === 0) {
    console.error("❌ No deployment files found");
    process.exitCode = 1;
    return;
  }

  const latestFile = files[0];
  const deploymentData = JSON.parse(
    fs.readFileSync(path.join(deploymentDir, latestFile), "utf-8")
  );

  console.log("📋 Latest Deployment Addresses:");
  console.log("═".repeat(60));
  console.log(`Network:    ${deploymentData.network}`);
  console.log(`Deployer:   ${deploymentData.deployer}`);
  console.log(`AfriCoin:   ${deploymentData.afriCoin}`);
  console.log(`MockOracle: ${deploymentData.mockOracle}`);
  // console.log(`Timelock:   ${deploymentData.timelock}`);
  // console.log(`AfriDAO:    ${deploymentData.afriDAO}`);
  console.log("═".repeat(60));

  console.log("\n📝 To verify on Etherscan, run:");
  console.log(`\nnpx hardhat verify --network baseSepolia ${deploymentData.afriCoin}`);
  console.log(`npx hardhat verify --network baseSepolia ${deploymentData.mockOracle}`);
  //console.log(
  //  `npx hardhat verify --network baseSepolia ${deploymentData.timelock} 3600 "${deploymentData.deployer}" "${deploymentData.deployer}" "${deploymentData.deployer}"`
  //);
  //console.log(
  //  `npx hardhat verify --network baseSepolia ${deploymentData.afriDAO} "${deploymentData.afriCoin}" "${deploymentData.timelock}"`
  //);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});