"use strict";
// IPFS Service - Handles metadata upload to IPFS (Pinata-compatible)
// Made optional to allow backend to start without IPFS configured
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipfsService = exports.IpfsService = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
class IpfsService {
    pinataClient = null;
    constructor() {
        // Initialize Pinata API client if configured
        if (env_1.env.IPFS_API_URL && env_1.env.IPFS_JWT_TOKEN) {
            this.pinataClient = axios_1.default.create({
                baseURL: env_1.env.IPFS_API_URL,
                headers: {
                    'Authorization': `Bearer ${env_1.env.IPFS_JWT_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            });
        }
    }
    /**
     * Upload metadata to IPFS (Pinata-compatible)
     */
    async uploadMetadata(metadata) {
        if (!this.pinataClient) {
            throw new Error('IPFS client not configured. Set IPFS_API_URL and IPFS_JWT_TOKEN in environment.');
        }
        try {
            const response = await this.pinataClient.post('/pinning/pinJSONToIPFS', {
                pinataContent: metadata,
                pinataOptions: {
                    cidVersion: 1,
                },
                pinataMetadata: {
                    name: `wca-figurine-${Date.now()}`,
                },
            });
            const ipfsHash = response.data.IpfsHash;
            return `ipfs://${ipfsHash}`;
        }
        catch (error) {
            console.error('[IPFS] Upload failed:', error);
            if (axios_1.default.isAxiosError(error)) {
                throw new Error(`Failed to upload to IPFS: ${error.response?.data?.error || error.message}`);
            }
            throw new Error('Failed to upload metadata to IPFS');
        }
    }
    /**
     * Create NFT metadata object
     */
    createNFTMetadata(params) {
        return {
            name: params.name,
            description: params.description,
            image: params.imageURI || '',
            attributes: params.attributes || [],
            properties: {
                characterId: params.characterId,
            },
        };
    }
    /**
     * Get IPFS gateway URL for a hash
     */
    getGatewayURL(hash) {
        const gateway = env_1.env.IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';
        return `${gateway}${hash}`;
    }
}
exports.IpfsService = IpfsService;
exports.ipfsService = new IpfsService();
//# sourceMappingURL=ipfsService.js.map