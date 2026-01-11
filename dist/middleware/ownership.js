"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCharacterOwnership = verifyCharacterOwnership;
exports.verifyFigurineOwnership = verifyFigurineOwnership;
exports.verifyNFTOwnership = verifyNFTOwnership;
exports.verifyNFCScanAuthorization = verifyNFCScanAuthorization;
const database_1 = require("../config/database");
const nftService_1 = require("../services/nftService");
/**
 * Ownership validation middleware
 * Verifies that the authenticated user owns the requested resource
 */
/**
 * Verify user owns a character
 */
async function verifyCharacterOwnership(req, res, next) {
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
        const character = await database_1.prisma.character.findUnique({
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to verify ownership' });
    }
}
/**
 * Verify user owns a figurine
 */
async function verifyFigurineOwnership(req, res, next) {
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
        const figurine = await database_1.prisma.figurine.findUnique({
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to verify ownership' });
    }
}
/**
 * Verify NFT ownership on-chain
 * For operations that require current NFT ownership (not just database ownership)
 */
async function verifyNFTOwnership(req, res, next) {
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
        const figurine = await database_1.prisma.figurine.findUnique({
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
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: { walletAddress: true },
        });
        if (!user?.walletAddress) {
            res.status(400).json({ error: 'Wallet address not linked to account' });
            return;
        }
        const ownsNFT = await nftService_1.nftService.verifyOwnership(figurine.tokenId, user.walletAddress);
        if (!ownsNFT) {
            res.status(403).json({
                error: 'NFT ownership verification failed. You do not own this NFT on-chain.',
            });
            return;
        }
        // Update database ownership if it differs (NFT was transferred)
        if (figurine.ownerId !== req.user.id) {
            await database_1.prisma.figurine.update({
                where: { id: figurineId },
                data: { ownerId: req.user.id },
            });
        }
        next();
    }
    catch (error) {
        console.error('[Ownership] Verification error:', error);
        res.status(500).json({ error: 'Failed to verify NFT ownership' });
    }
}
/**
 * Verify NFC scan authorization
 * For NFC scan operations - requires NFT ownership if NFT exists
 */
async function verifyNFCScanAuthorization(req, res, next) {
    const nfcUid = req.params.nfcUid || req.body.nfcUid;
    if (!nfcUid) {
        res.status(400).json({ error: 'NFC UID required' });
        return;
    }
    try {
        const figurine = await database_1.prisma.figurine.findUnique({
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
            const ownsNFT = await nftService_1.nftService.verifyOwnership(figurine.tokenId, figurine.owner.walletAddress);
            if (!ownsNFT) {
                res.status(403).json({
                    error: 'NFC scan rejected: NFT ownership verification failed. The NFT may have been transferred.',
                });
                return;
            }
        }
        // Attach figurine to request for route handlers
        req.figurine = figurine;
        next();
    }
    catch (error) {
        console.error('[Ownership] NFC scan authorization error:', error);
        res.status(500).json({ error: 'Failed to verify NFC authorization' });
    }
}
//# sourceMappingURL=ownership.js.map