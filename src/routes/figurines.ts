import { Router, Request, Response } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { verifyFigurineOwnership, verifyNFCScanAuthorization } from '../middleware/ownership';
import { figurineService } from '../services/figurineService';

const router = Router();

/**
 * POST /figurines/bind
 * Bind an NFC UID to user account
 * Requires authentication
 */
router.post('/bind', authenticate, async (req: Request, res: Response) => {
  try {
    const { nfcUid, characterId } = req.body;

    if (!nfcUid) {
      res.status(400).json({ error: 'NFC UID is required' });
      return;
    }

    const figurine = await figurineService.bindFigurine(
      req.user!.id,
      nfcUid,
      characterId
    );

    res.status(201).json({
      success: true,
      data: figurine,
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to bind figurine',
    });
  }
});

/**
 * GET /figurines
 * List all figurines owned by authenticated user
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const figurines = await figurineService.getUserFigurines(req.user!.id);

    res.json({
      success: true,
      data: figurines,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch figurines' });
  }
});

/**
 * GET /figurines/:figurineId
 * Get figurine details
 */
router.get('/:figurineId', authenticate, verifyFigurineOwnership, async (req: Request, res: Response) => {
  try {
    const figurine = await figurineService.getFigurineByNfcUid(req.params.figurineId);
    // Actually get by ID, not NFC UID
    const { prisma } = await import('../config/database');
    const figurineById = await prisma.figurine.findUnique({
      where: { id: req.params.figurineId },
      include: {
        owner: {
          select: { id: true, email: true, walletAddress: true },
        },
        linkedCharacter: {
          select: {
            id: true,
            name: true,
            class: true,
            level: true,
          },
        },
      },
    });

    if (!figurineById) {
      res.status(404).json({ error: 'Figurine not found' });
      return;
    }

    res.json({
      success: true,
      data: figurineById,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch figurine' });
  }
});

/**
 * POST /figurines/:figurineId/link-character
 * Link a character to an existing figurine
 */
router.post('/:figurineId/link-character', authenticate, verifyFigurineOwnership, async (req: Request, res: Response) => {
  try {
    const { characterId } = req.body;

    if (!characterId) {
      res.status(400).json({ error: 'Character ID is required' });
      return;
    }

    await figurineService.linkCharacter(
      req.user!.id,
      req.params.figurineId,
      characterId
    );

    res.json({
      success: true,
      message: 'Character linked to figurine',
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to link character',
    });
  }
});

/**
 * DELETE /figurines/:figurineId/unlink-character
 * Unlink character from figurine
 */
router.delete('/:figurineId/unlink-character', authenticate, verifyFigurineOwnership, async (req: Request, res: Response) => {
  try {
    await figurineService.unbindCharacter(req.user!.id, req.params.figurineId);

    res.json({
      success: true,
      message: 'Character unlinked from figurine',
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to unlink character',
    });
  }
});

/**
 * GET /figurines/nfc/:nfcUid
 * Public endpoint for NFC scans
 * Verifies NFT ownership if NFT exists
 * Returns character data for game client
 */
router.get('/nfc/:nfcUid', optionalAuthenticate, verifyNFCScanAuthorization, async (req: Request, res: Response) => {
  try {
    const figurine = (req as any).figurine;

    if (!figurine.linkedCharacter) {
      res.status(404).json({
        error: 'Figurine is not linked to a character',
      });
      return;
    }

    // Return character data suitable for game client
    const { prisma } = await import('../config/database');
    const character = await prisma.character.findUnique({
      where: { id: figurine.linkedCharacterId! },
      select: {
        id: true,
        name: true,
        class: true,
        level: true,
        race: true,
        baseStats: true,
        derivedStats: true,
        equipment: true,
        spells: true,
      },
    });

    if (!character) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        figurine: {
          id: figurine.id,
          nfcUid: figurine.nfcUid,
          tokenId: figurine.tokenId?.toString(),
        },
        character,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch NFC data' });
  }
});

export default router;
