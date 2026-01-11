// IPFS Service - Handles metadata upload to IPFS (Pinata-compatible)
// Made optional to allow backend to start without IPFS configured

import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';

export class IpfsService {
  private pinataClient: AxiosInstance | null = null;

  constructor() {
    // Initialize Pinata API client if configured
    if (env.IPFS_API_URL && env.IPFS_JWT_TOKEN) {
      this.pinataClient = axios.create({
        baseURL: env.IPFS_API_URL,
        headers: {
          'Authorization': `Bearer ${env.IPFS_JWT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    }
  }

  /**
   * Upload metadata to IPFS (Pinata-compatible)
   */
  async uploadMetadata(metadata: Record<string, unknown>): Promise<string> {
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
    } catch (error) {
      console.error('[IPFS] Upload failed:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to upload to IPFS: ${error.response?.data?.error || error.message}`);
      }
      throw new Error('Failed to upload metadata to IPFS');
    }
  }

  /**
   * Create NFT metadata object
   */
  createNFTMetadata(params: {
    name: string;
    description: string;
    characterId: string;
    imageURI?: string;
    attributes?: Array<{ trait_type: string; value: string | number }>;
  }): Record<string, unknown> {
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
  getGatewayURL(hash: string): string {
    const gateway = env.IPFS_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';
    return `${gateway}${hash}`;
  }
}

export const ipfsService = new IpfsService();
