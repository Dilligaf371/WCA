/**
 * NFT Minting Service
 * Handles minting of figurine NFTs on Polygon with IPFS metadata storage
 */
export declare class NFTService {
    private provider;
    private signer;
    private contract;
    private contractAddress;
    constructor();
    /**
     * Initialize contract instance (call after deployment)
     */
    setContractAddress(address: string): void;
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
    mintFigurineNFT(userId: string, figurineId: string, recipientAddress: string): Promise<{
        tokenId: bigint;
        txHash: string;
        metadataURI: string;
    }>;
    /**
     * Verify NFT ownership on-chain
     * Returns true if the wallet address owns the token
     */
    verifyOwnership(tokenId: bigint, walletAddress: string): Promise<boolean>;
    /**
     * Get NFT owner from blockchain
     */
    getNFTOwner(tokenId: bigint): Promise<string | null>;
    /**
     * Check if contract is initialized
     */
    isInitialized(): boolean;
}
export declare const nftService: NFTService;
//# sourceMappingURL=nftService.d.ts.map