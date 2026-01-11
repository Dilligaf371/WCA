import { ethers } from "hardhat";

/**
 * Set the minter address for FigurineNFT contract
 * 
 * Usage:
 *   MINTER_ADDRESS=0x... CONTRACT_ADDRESS=0x... npx hardhat run scripts/setMinter.ts --network polygon
 */
async function main() {
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || process.env.FIGURINE_CONTRACT_ADDRESS;
  const MINTER_ADDRESS = process.env.MINTER_ADDRESS;

  if (!CONTRACT_ADDRESS) {
    throw new Error("CONTRACT_ADDRESS or FIGURINE_CONTRACT_ADDRESS must be set");
  }

  if (!MINTER_ADDRESS) {
    throw new Error("MINTER_ADDRESS must be set");
  }

  const [deployer] = await ethers.getSigners();
  console.log("Setting minter with account:", deployer.address);

  const FigurineNFT = await ethers.getContractFactory("FigurineNFT");
  const contract = FigurineNFT.attach(CONTRACT_ADDRESS);

  const tx = await contract.setMinter(MINTER_ADDRESS);
  await tx.wait();

  console.log(`Minter set to: ${MINTER_ADDRESS}`);
  console.log("Transaction hash:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
