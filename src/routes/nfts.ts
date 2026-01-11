import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { verifyNFTOwnership } from '../middleware/ownership';
import { nftService } from '../services/nftService';
import { prisma } from '../config/database';

const router = Router();

/**
 * POST /nfts/mint
 * Mint NFT for a figurine
 * Requires:
 * - Figurine ownership
 * - Character linked to figurine
 * - Wallet address linked to user account
 */
router.post('/mint', authenticate, async (req: Request, res: Response) => {
  try {
    const { figurineId, recipientAddress } = req.body;

    if (!figurineId) {
      res.status(400).json({ error: 'Figurine ID is required' });
      return;
    }

    // Get user's wallet address (can override with recipientAddress)
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { walletAddress: true },
    });

    if (!user?.walletAddress && !recipientAddress) {
      res.status(400).json({
        error: 'Wallet address not linked to account. Link wallet or provide recipientAddress.',
      });
      return;
    }

    const targetAddress = recipientAddress || user.walletAddress!;

    // Verify figurine ownership
    const figurine = await prisma.figurine.findUnique({
      where: { id: figurineId },
      select: { ownerId: true },
    });

    if (!figurine) {
      res.status(404).json({ error: 'Figurine not found' });
      return;
    }

    if (figurine.ownerId !== req.user!.id) {
      res.status(403).json({ error: 'You do not own this figurine' });
      return;
    }

    const result = await nftService.mintFigurineNFT(
      req.user!.id,
      figurineId,
      targetAddress
    );

    res.status(201).json({
      success: true,
      data: {
        tokenId: result.tokenId.toString(),
        txHash: result.txHash,
        metadataURI: result.metadataURI,
      },
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'NFT minting failed',
    });
  }
});

/**
 * GET /nfts/verify/:figurineId
 * Verify NFT ownership for a figurine
 */
router.get('/verify/:figurineId', authenticate, async (req: Request, res: Response) => {
  try {
    const figurine = await prisma.figurine.findUnique({
      where: { id: req.params.figurineId },
      select: {
        tokenId: true,
        contractAddress: true,
        ownerId: true,
      },
    });

    if (!figurine) {
      res.status(404).json({ error: 'Figurine not found' });
      return;
    }

    if (!figurine.tokenId || !figurine.contractAddress) {
      res.json({
        success: true,
        data: {
          hasNFT: false,
          ownsNFT: false,
        },
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { walletAddress: true },
    });

    if (!user?.walletAddress) {
      res.status(400).json({ error: 'Wallet address not linked to account' });
      return;
    }

    const ownsNFT = await nftService.verifyOwnership(
      figurine.tokenId,
      user.walletAddress
    );

    res.json({
      success: true,
      data: {
        hasNFT: true,
        ownsNFT,
        tokenId: figurine.tokenId.toString(),
        contractAddress: figurine.contractAddress,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to verify ownership',
    });
  }
});

/**
 * GET /nfts/owner/:tokenId
 * Get current NFT owner from blockchain
 */
router.get('/owner/:tokenId', async (req: Request, res: Response) => {
  try {
    const tokenId = BigInt(req.params.tokenId);

    const owner = await nftService.getNFTOwner(tokenId);

    if (!owner) {
      res.status(404).json({ error: 'NFT not found or contract not initialized' });
      return;
    }

    res.json({
      success: true,
      data: {
        tokenId: req.params.tokenId,
        owner,
      },
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to fetch owner',
    });
  }
});

export default router;
