"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const ownership_1 = require("../middleware/ownership");
const dndBeyondImporter_1 = require("../services/dndBeyondImporter");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
/**
 * POST /characters/import
 * Import character from D&D Beyond
 * Supports:
 * 1. D&D Beyond character ID (if API configured)
 * 2. Raw JSON payload (manual import)
 */
router.post('/import', auth_1.authenticate, async (req, res) => {
    try {
        const { dndBeyondCharacterId, rawData, characterUrl } = req.body;
        console.log('[Character Import] Request received:', {
            hasDndBeyondCharacterId: !!dndBeyondCharacterId,
            hasRawData: !!rawData,
            rawDataType: typeof rawData,
            rawDataKeys: rawData && typeof rawData === 'object' ? Object.keys(rawData) : 'N/A'
        });
        if (!dndBeyondCharacterId && !rawData) {
            res.status(400).json({
                error: 'Either dndBeyondCharacterId or rawData (JSON) is required',
            });
            return;
        }
        let rawCharacterData;
        // If rawData provided, use it directly (manual import)
        if (rawData) {
            // D&D Beyond API wraps data in {success: true, data: {...}, message: "..."}
            // Extract the actual character data if wrapped
            if (typeof rawData === 'object' && rawData !== null) {
                if ('data' in rawData && rawData.data && typeof rawData.data === 'object') {
                    // The JSON is wrapped: {success: true, data: {id: ..., name: ...}, ...}
                    rawCharacterData = rawData.data;
                    console.log('[Character Import] Extracted data from wrapped format, id:', rawCharacterData.id);
                }
                else if ('id' in rawData) {
                    // The JSON is the character object directly
                    rawCharacterData = rawData;
                    console.log('[Character Import] Using direct character object, id:', rawCharacterData.id);
                }
                else {
                    console.error('[Character Import] Invalid rawData format, keys:', Object.keys(rawData));
                    res.status(400).json({
                        error: 'rawData must include character data (wrapped in data field or direct character object)'
                    });
                    return;
                }
            }
            else {
                console.error('[Character Import] rawData is not an object:', typeof rawData);
                res.status(400).json({ error: 'rawData must be a valid JSON object' });
                return;
            }
            // Ensure we have an ID
            if (!rawCharacterData.id) {
                // Try to extract ID from dndBeyondCharacterId if provided
                if (dndBeyondCharacterId) {
                    rawCharacterData.id = dndBeyondCharacterId;
                    console.log('[Character Import] Using dndBeyondCharacterId as id:', dndBeyondCharacterId);
                }
                else {
                    console.error('[Character Import] No id found in rawCharacterData and no dndBeyondCharacterId provided');
                    res.status(400).json({ error: 'rawData must include character id or provide dndBeyondCharacterId' });
                    return;
                }
            }
        }
        console.log('[Character Import] Calling importCharacter with:', {
            userId: req.user.id,
            userEmail: req.user.email,
            characterId: rawCharacterData?.id || dndBeyondCharacterId,
            hasRawData: !!rawCharacterData
        });
        const result = await dndBeyondImporter_1.dndBeyondImporter.importCharacter(req.user.id, rawCharacterData?.id || dndBeyondCharacterId || '', rawCharacterData, characterUrl);
        console.log('[Character Import] Import successful:', result);
        console.log('[Character Import] Character ID created:', result.characterId);
        console.log('[Character Import] Is new character:', result.isNew);
        res.status(result.isNew ? 201 : 200).json({
            success: true,
            data: {
                characterId: result.characterId,
                isNew: result.isNew,
                isUpdated: result.isUpdated,
            },
        });
    }
    catch (error) {
        console.error('[Character Import] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Character import failed';
        console.error('[Character Import] Error message:', errorMessage);
        console.error('[Character Import] Error stack:', error instanceof Error ? error.stack : 'N/A');
        res.status(400).json({
            error: errorMessage,
        });
    }
});
/**
 * GET /characters
 * List all characters owned by authenticated user
 */
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        console.log('[Characters List] Request received, user ID:', req.user.id);
        const characters = await database_1.prisma.character.findMany({
            where: { ownerId: req.user.id },
            select: {
                id: true,
                name: true,
                class: true,
                level: true,
                race: true,
                campaign: true,
                syncStatus: true,
                lastSyncAt: true,
                createdAt: true,
                dndBeyondCharacterId: true,
                baseStats: true,
                derivedStats: true,
                equipment: true,
                figurine: {
                    select: {
                        id: true,
                        nfcUid: true,
                        tokenId: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        console.log('[Characters List] Found characters:', characters.length, 'for user:', req.user.id);
        console.log('[Characters List] Character IDs:', characters.map(c => c.id));
        res.json({
            success: true,
            data: characters,
        });
    }
    catch (error) {
        console.error('[Characters List] Error:', error);
        res.status(500).json({ error: 'Failed to fetch characters' });
    }
});
/**
 * GET /characters/:characterId
 * Get full character sheet (read-only)
 */
router.get('/:characterId', auth_1.authenticate, ownership_1.verifyCharacterOwnership, async (req, res) => {
    try {
        const character = await database_1.prisma.character.findUnique({
            where: { id: req.params.characterId },
            select: {
                id: true,
                name: true,
                class: true,
                level: true,
                race: true,
                background: true,
                alignment: true,
                campaign: true,
                baseStats: true,
                derivedStats: true,
                equipment: true,
                spells: true,
                syncStatus: true,
                lastSyncAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!character) {
            res.status(404).json({ error: 'Character not found' });
            return;
        }
        res.json({
            success: true,
            data: character,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch character' });
    }
});
/**
 * POST /characters/:characterId/sync
 * Re-sync character with D&D Beyond
 */
router.post('/:characterId/sync', auth_1.authenticate, ownership_1.verifyCharacterOwnership, async (req, res) => {
    try {
        const character = await database_1.prisma.character.findUnique({
            where: { id: req.params.characterId },
            select: { dndBeyondCharacterId: true },
        });
        if (!character || !character.dndBeyondCharacterId) {
            res.status(400).json({
                error: 'Character does not have a D&D Beyond ID linked',
            });
            return;
        }
        const result = await dndBeyondImporter_1.dndBeyondImporter.importCharacter(req.user.id, character.dndBeyondCharacterId);
        res.json({
            success: true,
            data: {
                characterId: result.characterId,
                isUpdated: result.isUpdated,
            },
        });
    }
    catch (error) {
        res.status(400).json({
            error: error instanceof Error ? error.message : 'Sync failed',
        });
    }
});
/**
 * GET /characters/:characterId/check-sync
 * Check if character needs sync
 */
router.get('/:characterId/check-sync', auth_1.authenticate, ownership_1.verifyCharacterOwnership, async (req, res) => {
    try {
        const syncStatus = await dndBeyondImporter_1.dndBeyondImporter.checkSyncStatus(req.params.characterId);
        res.json({
            success: true,
            data: syncStatus,
        });
    }
    catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to check sync status',
        });
    }
});
/**
 * DELETE /characters/:characterId
 * Delete a character
 */
router.delete('/:characterId', auth_1.authenticate, ownership_1.verifyCharacterOwnership, async (req, res) => {
    try {
        await database_1.prisma.character.delete({
            where: { id: req.params.characterId },
        });
        res.json({
            success: true,
            message: 'Character deleted successfully',
        });
    }
    catch (error) {
        console.error('[Character Delete] Error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to delete character',
        });
    }
});
exports.default = router;
//# sourceMappingURL=characters.js.map