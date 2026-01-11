import { ethers, Contract } from 'ethers';
import { prisma } from '../config/database';
import { ipfsService } from './ipfsService';
import { env } from '../config/env';
import { AuditAction } from '@prisma/client';
import FigurineNFTArtifact from '../artifacts/FigurineNFT.json';

// Contract ABI for FigurineNFT
// In production, load from compiled artifact or contract address via Etherscan API
const FIGURINE_NFT_ABI = [
  'function mint(address to, string memory metadataURI) external returns (uint256)',
  'function mintWithRoyalty(address to, string memory metadataURI, uint96 royaltyBps) external returns (uint256)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'function getCurrentTokenId() external view returns (uint256)',
  'event TokenMinted(uint256 indexed tokenId, address indexed to, string metadataURI, uint96 royaltyBps)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
] as const;

/**
 * NFT Minting Service
 * Handles minting of figurine NFTs on Polygon with IPFS metadata storage
 */
export class NFTService {
  private provider: ethers.Provider;
  private signer: ethers.Wallet;
  private contract: Contract | null = null;
  private contractAddress: string | null = null;

  constructor() {
    // Initialize Polygon provider
    this.provider = new ethers.JsonRpcProvider(env.POLYGON_RPC_URL);
    
    // Initialize signer from private key
    this.signer = new ethers.Wallet(env.POLYGON_PRIVATE_KEY, this.provider);

    // Initialize contract if address is configured
    if (env.FIGURINE_CONTRACT_ADDRESS) {
      this.contractAddress = env.FIGURINE_CONTRACT_ADDRESS;
      // Use ABI from artifact if available, otherwise use minimal ABI
      const abi = (FigurineNFTArtifact as any).abi || FIGURINE_NFT_ABI;
      this.contract = new ethers.Contract(
        this.contractAddress,
        abi,
        this.signer
      );
    }
  }

  /**
   * Initialize contract instance (call after deployment)
   */
  setContractAddress(address: string): void {
    this.contractAddress = address;
    const abi = (FigurineNFTArtifact as any).abi || FIGURINE_NFT_ABI;
    this.contract = new ethers.Contract(
      address,
      abi,
      this.signer
    );
  }

  /**
   * Mint an NFT for a figurine
   * Requires:
   * 1. Figurine must be bound to user
   * 2. Character must be linked to figurine
   * 3. User must own the character
   * 
   * @param userId User ID requesting the mint
   * @param figurineId Figurine ID to mint NFT for
   * @param recipientAddress Polygon wallet address to receive NFT
   * @returns Token ID and transaction hash
   */
  async mintFigurineNFT(
    userId: string,
    figurineId: string,
    recipientAddress: string
  ): Promise<{ tokenId: bigint; txHash: string; metadataURI: string }> {
    if (!this.contract) {
      throw new Error('NFT contract not initialized. Set FIGURINE_CONTRACT_ADDRESS in environment.');
    }

    // Validate recipient address
    if (!ethers.isAddress(recipientAddress)) {
      throw new Error('Invalid recipient address');
    }

    // Fetch figurine and verify ownership
    const figurine = await prisma.figurine.findUnique({
      where: { id: figurineId },
      include: {
        owner: {
          select: { id: true, walletAddress: true },
        },
        linkedCharacter: true,
      },
    });

    if (!figurine) {
      throw new Error('Figurine not found');
    }

    if (figurine.ownerId !== userId) {
      throw new Error('Only the figurine owner can mint NFT');
    }

    if (!figurine.linkedCharacter) {
      throw new Error('Figurine must be linked to a character before minting NFT');
    }

    if (figurine.tokenId !== null) {
      throw new Error('NFT already minted for this figurine');
    }

    const character = figurine.linkedCharacter;

    // Create NFT metadata
    const metadata = ipfsService.createNFTMetadata({
      name: `${character.name} - WarChain Arena Figurine`,
      description: `A physical figurine representing ${character.name}, a level ${character.level} ${character.class}`,
      characterId: character.id,
      attributes: [
        { trait_type: 'Character Name', value: character.name },
        { trait_type: 'Class', value: character.class },
        { trait_type: 'Level', value: character.level },
        { trait_type: 'NFC UID', value: figurine.nfcUid },
      ],
      external_url: `https://warchainarena.com/figurines/${figurine.id}`,
    });

    // Upload metadata to IPFS
    const metadataURI = await ipfsService.uploadMetadata(metadata);

    // Mint NFT on Polygon
    let tokenId: bigint;
    let txHash: string;

    try {
      // Estimate gas first
      const gasEstimate = await this.contract.mint.estimateGas(recipientAddress, metadataURI);
      
      // Mint with 20% buffer for gas
      const tx = await this.contract.mint(recipientAddress, metadataURI, {
        gasLimit: (gasEstimate * 120n) / 100n,
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error('Transaction failed - no receipt');
      }

      txHash = receipt.hash;

      // Get token ID from event or transaction receipt
      // The mint function returns the tokenId, so we can get it from the event
      const mintEvent = receipt.logs
        .map((log: { topics: string[]; data: string }) => {
          try {
            return this.contract!.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsed: { name: string } | null) => parsed?.name === 'TokenMinted' || parsed?.name === 'Transfer');

      if (mintEvent && mintEvent.args) {
        // Transfer event has tokenId as third topic
        // TokenMinted event has tokenId as first argument
        tokenId = mintEvent.name === 'TokenMinted' 
          ? BigInt(mintEvent.args[0])
          : BigInt(mintEvent.args[2]);
      } else {
        // Fallback: query the current token counter
        const currentId = await this.contract.getCurrentTokenId();
        tokenId = BigInt(currentId.toString()) - 1n;
      }

    } catch (error) {
      console.error('[NFTService] Minting failed:', error);
      throw new Error(
        `Failed to mint NFT: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Update database within transaction
    await prisma.$transaction(async (tx) => {
      await tx.figurine.update({
        where: { id: figurineId },
        data: {
          tokenId,
          contractAddress: this.contractAddress!,
          mintedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          action: AuditAction.NFT_MINT,
          userId,
          figurineId,
          characterId: character.id,
          metadata: {
            tokenId: tokenId.toString(),
            contractAddress: this.contractAddress,
            recipientAddress,
            metadataURI,
            txHash,
          },
        },
      });
    });

    return { tokenId, txHash, metadataURI };
  }

  /**
   * Verify NFT ownership on-chain
   * Returns true if the wallet address owns the token
   */
  async verifyOwnership(tokenId: bigint, walletAddress: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('NFT contract not initialized');
    }

    try {
      const owner = await this.contract.ownerOf(tokenId);
      return owner.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
      // Token doesn't exist or other error
      return false;
    }
  }

  /**
   * Get NFT owner from blockchain
   */
  async getNFTOwner(tokenId: bigint): Promise<string | null> {
    if (!this.contract) {
      return null;
    }

    try {
      return await this.contract.ownerOf(tokenId);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if contract is initialized
   */
  isInitialized(): boolean {
    return this.contract !== null && this.contractAddress !== null;
  }
}

export const nftService = new NFTService();
