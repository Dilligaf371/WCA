import { ethers } from "hardhat";

/**
 * Deploy FigurineNFT contract to Polygon
 * 
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network polygon
 *   npx hardhat run scripts/deploy.ts --network mumbai  # For testnet
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Configuration
  const ROYALTY_RECIPIENT = process.env.ROYALTY_RECIPIENT || deployer.address;
  const CONTRACT_OWNER = process.env.CONTRACT_OWNER || deployer.address;

  console.log("Royalty recipient:", ROYALTY_RECIPIENT);
  console.log("Contract owner:", CONTRACT_OWNER);

  // Deploy contract
  const FigurineNFT = await ethers.getContractFactory("FigurineNFT");
  const figurineNFT = await FigurineNFT.deploy(ROYALTY_RECIPIENT, CONTRACT_OWNER);

  await figurineNFT.waitForDeployment();
  const address = await figurineNFT.getAddress();

  console.log("FigurineNFT deployed to:", address);
  console.log("\nNext steps:");
  console.log(`1. Set FIGURINE_CONTRACT_ADDRESS=${address} in .env`);
  console.log(`2. Set minter address: npx hardhat run scripts/setMinter.ts --network polygon`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
