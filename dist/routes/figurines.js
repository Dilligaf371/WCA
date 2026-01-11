"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const ownership_1 = require("../middleware/ownership");
const figurineService_1 = require("../services/figurineService");
const router = (0, express_1.Router)();
/**
 * POST /figurines/bind
 * Bind an NFC UID to user account
 * Requires authentication
 */
router.post('/bind', auth_1.authenticate, async (req, res) => {
    try {
        const { nfcUid, characterId } = req.body;
        if (!nfcUid) {
            res.status(400).json({ error: 'NFC UID is required' });
            return;
        }
        const figurine = await figurineService_1.figurineService.bindFigurine(req.user.id, nfcUid, characterId);
        res.status(201).json({
            success: true,
            data: figurine,
        });
    }
    catch (error) {
        res.status(400).json({
            error: error instanceof Error ? error.message : 'Failed to bind figurine',
        });
    }
});
/**
 * GET /figurines
 * List all figurines owned by authenticated user
 */
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const figurines = await figurineService_1.figurineService.getUserFigurines(req.user.id);
        res.json({
            success: true,
            data: figurines,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch figurines' });
    }
});
/**
 * GET /figurines/:figurineId
 * Get figurine details
 */
router.get('/:figurineId', auth_1.authenticate, ownership_1.verifyFigurineOwnership, async (req, res) => {
    try {
        const figurine = await figurineService_1.figurineService.getFigurineByNfcUid(req.params.figurineId);
        // Actually get by ID, not NFC UID
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch figurine' });
    }
});
/**
 * POST /figurines/:figurineId/link-character
 * Link a character to an existing figurine
 */
router.post('/:figurineId/link-character', auth_1.authenticate, ownership_1.verifyFigurineOwnership, async (req, res) => {
    try {
        const { characterId } = req.body;
        if (!characterId) {
            res.status(400).json({ error: 'Character ID is required' });
            return;
        }
        await figurineService_1.figurineService.linkCharacter(req.user.id, req.params.figurineId, characterId);
        res.json({
            success: true,
            message: 'Character linked to figurine',
        });
    }
    catch (error) {
        res.status(400).json({
            error: error instanceof Error ? error.message : 'Failed to link character',
        });
    }
});
/**
 * DELETE /figurines/:figurineId/unlink-character
 * Unlink character from figurine
 */
router.delete('/:figurineId/unlink-character', auth_1.authenticate, ownership_1.verifyFigurineOwnership, async (req, res) => {
    try {
        await figurineService_1.figurineService.unbindCharacter(req.user.id, req.params.figurineId);
        res.json({
            success: true,
            message: 'Character unlinked from figurine',
        });
    }
    catch (error) {
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
router.get('/nfc/:nfcUid', auth_1.optionalAuthenticate, ownership_1.verifyNFCScanAuthorization, async (req, res) => {
    try {
        const figurine = req.figurine;
        if (!figurine.linkedCharacter) {
            res.status(404).json({
                error: 'Figurine is not linked to a character',
            });
            return;
        }
        // Return character data suitable for game client
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
        const character = await prisma.character.findUnique({
            where: { id: figurine.linkedCharacterId },
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch NFC data' });
    }
});
exports.default = router;
//# sourceMappingURL=figurines.js.map