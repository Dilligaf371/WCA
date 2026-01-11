export declare class IpfsService {
    private pinataClient;
    constructor();
    /**
     * Upload metadata to IPFS (Pinata-compatible)
     */
    uploadMetadata(metadata: Record<string, unknown>): Promise<string>;
    /**
     * Create NFT metadata object
     */
    createNFTMetadata(params: {
        name: string;
        description: string;
        characterId: string;
        imageURI?: string;
        attributes?: Array<{
            trait_type: string;
            value: string | number;
        }>;
    }): Record<string, unknown>;
    /**
     * Get IPFS gateway URL for a hash
     */
    getGatewayURL(hash: string): string;
}
export declare const ipfsService: IpfsService;
//# sourceMappingURL=ipfsService.d.ts.map