"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nftService = exports.NFTService = void 0;
const ethers_1 = require("ethers");
const database_1 = require("../config/database");
const ipfsService_1 = require("./ipfsService");
const env_1 = require("../config/env");
const client_1 = require("@prisma/client");
const FigurineNFT_json_1 = __importDefault(require("../artifacts/FigurineNFT.json"));
// Contract ABI for FigurineNFT
// In production, load from compiled artifact or contract address via Etherscan API
const FIGURINE_NFT_ABI = [
    'function mint(address to, string memory metadataURI) external returns (uint256)',
    'function mintWithRoyalty(address to, string memory metadataURI, uint96 royaltyBps) external returns (uint256)',
    'function ownerOf(uint256 tokenId) external view returns (address)',
    'function getCurrentTokenId() external view returns (uint256)',
    'event TokenMinted(uint256 indexed tokenId, address indexed to, string metadataURI, uint96 royaltyBps)',
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
];
/**
 * NFT Minting Service
 * Handles minting of figurine NFTs on Polygon with IPFS metadata storage
 */
class NFTService {
    provider;
    signer;
    contract = null;
    contractAddress = null;
    constructor() {
        // Initialize Polygon provider
        this.provider = new ethers_1.ethers.JsonRpcProvider(env_1.env.POLYGON_RPC_URL);
        // Initialize signer from private key
        this.signer = new ethers_1.ethers.Wallet(env_1.env.POLYGON_PRIVATE_KEY, this.provider);
        // Initialize contract if address is configured
        if (env_1.env.FIGURINE_CONTRACT_ADDRESS) {
            this.contractAddress = env_1.env.FIGURINE_CONTRACT_ADDRESS;
            // Use ABI from artifact if available, otherwise use minimal ABI
            const abi = FigurineNFT_json_1.default.abi || FIGURINE_NFT_ABI;
            this.contract = new ethers_1.ethers.Contract(this.contractAddress, abi, this.signer);
        }
    }
    /**
     * Initialize contract instance (call after deployment)
     */
    setContractAddress(address) {
        this.contractAddress = address;
        const abi = FigurineNFT_json_1.default.abi || FIGURINE_NFT_ABI;
        this.contract = new ethers_1.ethers.Contract(address, abi, this.signer);
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
    async mintFigurineNFT(userId, figurineId, recipientAddress) {
        if (!this.contract) {
            throw new Error('NFT contract not initialized. Set FIGURINE_CONTRACT_ADDRESS in environment.');
        }
        // Validate recipient address
        if (!ethers_1.ethers.isAddress(recipientAddress)) {
            throw new Error('Invalid recipient address');
        }
        // Fetch figurine and verify ownership
        const figurine = await database_1.prisma.figurine.findUnique({
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
        const metadata = ipfsService_1.ipfsService.createNFTMetadata({
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
        const metadataURI = await ipfsService_1.ipfsService.uploadMetadata(metadata);
        // Mint NFT on Polygon
        let tokenId;
        let txHash;
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
                .map((log) => {
                try {
                    return this.contract.interface.parseLog(log);
                }
                catch {
                    return null;
                }
            })
                .find((parsed) => parsed?.name === 'TokenMinted' || parsed?.name === 'Transfer');
            if (mintEvent && mintEvent.args) {
                // Transfer event has tokenId as third topic
                // TokenMinted event has tokenId as first argument
                tokenId = mintEvent.name === 'TokenMinted'
                    ? BigInt(mintEvent.args[0])
                    : BigInt(mintEvent.args[2]);
            }
            else {
                // Fallback: query the current token counter
                const currentId = await this.contract.getCurrentTokenId();
                tokenId = BigInt(currentId.toString()) - 1n;
            }
        }
        catch (error) {
            console.error('[NFTService] Minting failed:', error);
            throw new Error(`Failed to mint NFT: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        // Update database within transaction
        await database_1.prisma.$transaction(async (tx) => {
            await tx.figurine.update({
                where: { id: figurineId },
                data: {
                    tokenId,
                    contractAddress: this.contractAddress,
                    mintedAt: new Date(),
                },
            });
            await tx.auditLog.create({
                data: {
                    action: client_1.AuditAction.NFT_MINT,
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
    async verifyOwnership(tokenId, walletAddress) {
        if (!this.contract) {
            throw new Error('NFT contract not initialized');
        }
        try {
            const owner = await this.contract.ownerOf(tokenId);
            return owner.toLowerCase() === walletAddress.toLowerCase();
        }
        catch (error) {
            // Token doesn't exist or other error
            return false;
        }
    }
    /**
     * Get NFT owner from blockchain
     */
    async getNFTOwner(tokenId) {
        if (!this.contract) {
            return null;
        }
        try {
            return await this.contract.ownerOf(tokenId);
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Check if contract is initialized
     */
    isInitialized() {
        return this.contract !== null && this.contractAddress !== null;
    }
}
exports.NFTService = NFTService;
exports.nftService = new NFTService();
//# sourceMappingURL=nftService.js.map