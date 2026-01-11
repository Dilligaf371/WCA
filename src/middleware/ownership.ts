import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { nftService } from '../services/nftService';

/**
 * Ownership validation middleware
 * Verifies that the authenticated user owns the requested resource
 */

/**
 * Verify user owns a character
 */
export async function verifyCharacterOwnership(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const characterId = req.params.characterId || req.body.characterId;

  if (!characterId) {
    res.status(400).json({ error: 'Character ID required' });
    return;
  }

  try {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { ownerId: true },
    });

    if (!character) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    if (character.ownerId !== req.user.id) {
      res.status(403).json({ error: 'You do not own this character' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify ownership' });
  }
}

/**
 * Verify user owns a figurine
 */
export async function verifyFigurineOwnership(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const figurineId = req.params.figurineId || req.body.figurineId;

  if (!figurineId) {
    res.status(400).json({ error: 'Figurine ID required' });
    return;
  }

  try {
    const figurine = await prisma.figurine.findUnique({
      where: { id: figurineId },
      select: { ownerId: true },
    });

    if (!figurine) {
      res.status(404).json({ error: 'Figurine not found' });
      return;
    }

    if (figurine.ownerId !== req.user.id) {
      res.status(403).json({ error: 'You do not own this figurine' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify ownership' });
  }
}

/**
 * Verify NFT ownership on-chain
 * For operations that require current NFT ownership (not just database ownership)
 */
export async function verifyNFTOwnership(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const figurineId = req.params.figurineId || req.body.figurineId;

  if (!figurineId) {
    res.status(400).json({ error: 'Figurine ID required' });
    return;
  }

  try {
    const figurine = await prisma.figurine.findUnique({
      where: { id: figurineId },
      select: {
        ownerId: true,
        tokenId: true,
        contractAddress: true,
      },
    });

    if (!figurine) {
      res.status(404).json({ error: 'Figurine not found' });
      return;
    }

    // If no NFT minted yet, check database ownership only
    if (!figurine.tokenId || !figurine.contractAddress) {
      if (figurine.ownerId !== req.user.id) {
        res.status(403).json({ error: 'You do not own this figurine' });
        return;
      }
      next();
      return;
    }

    // If NFT exists, verify on-chain ownership
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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

    if (!ownsNFT) {
      res.status(403).json({
        error: 'NFT ownership verification failed. You do not own this NFT on-chain.',
      });
      return;
    }

    // Update database ownership if it differs (NFT was transferred)
    if (figurine.ownerId !== req.user.id) {
      await prisma.figurine.update({
        where: { id: figurineId },
        data: { ownerId: req.user.id },
      });
    }

    next();
  } catch (error) {
    console.error('[Ownership] Verification error:', error);
    res.status(500).json({ error: 'Failed to verify NFT ownership' });
  }
}

/**
 * Verify NFC scan authorization
 * For NFC scan operations - requires NFT ownership if NFT exists
 */
export async function verifyNFCScanAuthorization(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const nfcUid = req.params.nfcUid || req.body.nfcUid;

  if (!nfcUid) {
    res.status(400).json({ error: 'NFC UID required' });
    return;
  }

  try {
    const figurine = await prisma.figurine.findUnique({
      where: { nfcUid },
      include: {
        owner: {
          select: { id: true, walletAddress: true },
        },
        linkedCharacter: true,
      },
    });

    if (!figurine) {
      res.status(404).json({ error: 'NFC tag not bound to any figurine' });
      return;
    }

    // If NFT exists, verify on-chain ownership
    if (figurine.tokenId && figurine.contractAddress && figurine.owner.walletAddress) {
      const ownsNFT = await nftService.verifyOwnership(
        figurine.tokenId,
        figurine.owner.walletAddress
      );

      if (!ownsNFT) {
        res.status(403).json({
          error: 'NFC scan rejected: NFT ownership verification failed. The NFT may have been transferred.',
        });
        return;
      }
    }

    // Attach figurine to request for route handlers
    (req as any).figurine = figurine;
    next();
  } catch (error) {
    console.error('[Ownership] NFC scan authorization error:', error);
    res.status(500).json({ error: 'Failed to verify NFC authorization' });
  }
}
