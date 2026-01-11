"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.figurineService = exports.FigurineService = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const client_1 = require("@prisma/client");
class FigurineService {
    /**
     * Bind an NFC UID to a user account
     * Enforces one-to-one binding and prevents race conditions with Redis locking
     *
     * @param userId User ID binding the figurine
     * @param nfcUid Unique NFC tag identifier
     * @param characterId Optional character to link to figurine
     * @returns Created figurine record
     */
    async bindFigurine(userId, nfcUid, characterId) {
        // Validate NFC UID format (alphanumeric, dashes, underscores)
        if (!/^[A-Za-z0-9_-]+$/.test(nfcUid)) {
            throw new Error('Invalid NFC UID format');
        }
        // Acquire distributed lock to prevent concurrent binding
        const lockKey = `figurine:bind:${nfcUid}`;
        const lockValue = await (0, redis_1.acquireLock)(lockKey, 30);
        if (!lockValue) {
            throw new Error('Failed to acquire lock. Another binding operation may be in progress.');
        }
        try {
            // Check if NFC UID is already bound (within transaction)
            const existing = await database_1.prisma.figurine.findUnique({
                where: { nfcUid },
                select: { id: true, ownerId: true },
            });
            if (existing) {
                throw new Error(`NFC UID ${nfcUid} is already bound to another figurine`);
            }
            // Verify character ownership if linking
            if (characterId) {
                const character = await database_1.prisma.character.findUnique({
                    where: { id: characterId },
                    select: { ownerId: true, figurine: { select: { id: true } } },
                });
                if (!character) {
                    throw new Error('Character not found');
                }
                if (character.ownerId !== userId) {
                    throw new Error('Character does not belong to user');
                }
                if (character.figurine) {
                    throw new Error('Character is already linked to a figurine');
                }
            }
            // Create figurine binding within transaction
            const figurine = await database_1.prisma.$transaction(async (tx) => {
                const newFigurine = await tx.figurine.create({
                    data: {
                        nfcUid,
                        ownerId: userId,
                        linkedCharacterId: characterId,
                    },
                });
                // Create audit log
                await tx.auditLog.create({
                    data: {
                        action: client_1.AuditAction.FIGURINE_BIND,
                        userId,
                        figurineId: newFigurine.id,
                        characterId,
                        metadata: { nfcUid },
                    },
                });
                return newFigurine;
            });
            return {
                id: figurine.id,
                nfcUid: figurine.nfcUid,
                tokenId: figurine.tokenId,
            };
        }
        finally {
            // Always release lock
            await (0, redis_1.releaseLock)(lockKey, lockValue);
        }
    }
    /**
     * Unbind a figurine from a character (but keep NFC binding to user)
     * Only allowed by figurine owner
     */
    async unbindCharacter(userId, figurineId) {
        const figurine = await database_1.prisma.figurine.findUnique({
            where: { id: figurineId },
            select: { ownerId: true, linkedCharacterId: true },
        });
        if (!figurine) {
            throw new Error('Figurine not found');
        }
        if (figurine.ownerId !== userId) {
            throw new Error('Only the figurine owner can unbind characters');
        }
        if (!figurine.linkedCharacterId) {
            throw new Error('Figurine is not linked to any character');
        }
        await database_1.prisma.$transaction(async (tx) => {
            await tx.figurine.update({
                where: { id: figurineId },
                data: { linkedCharacterId: null },
            });
            await tx.auditLog.create({
                data: {
                    action: client_1.AuditAction.FIGURINE_UNBIND,
                    userId,
                    figurineId,
                    characterId: figurine.linkedCharacterId,
                },
            });
        });
    }
    /**
     * Link a character to an existing figurine
     * Requires ownership of both figurine and character
     */
    async linkCharacter(userId, figurineId, characterId) {
        const [figurine, character] = await Promise.all([
            database_1.prisma.figurine.findUnique({
                where: { id: figurineId },
                select: { ownerId: true, linkedCharacterId: true },
            }),
            database_1.prisma.character.findUnique({
                where: { id: characterId },
                select: { ownerId: true, figurine: { select: { id: true } } },
            }),
        ]);
        if (!figurine) {
            throw new Error('Figurine not found');
        }
        if (!character) {
            throw new Error('Character not found');
        }
        if (figurine.ownerId !== userId) {
            throw new Error('Only the figurine owner can link characters');
        }
        if (character.ownerId !== userId) {
            throw new Error('Only the character owner can link to figurines');
        }
        if (figurine.linkedCharacterId) {
            throw new Error('Figurine is already linked to a character');
        }
        if (character.figurine) {
            throw new Error('Character is already linked to a figurine');
        }
        await database_1.prisma.$transaction(async (tx) => {
            await tx.figurine.update({
                where: { id: figurineId },
                data: { linkedCharacterId: characterId },
            });
            await tx.auditLog.create({
                data: {
                    action: client_1.AuditAction.FIGURINE_BIND,
                    userId,
                    figurineId,
                    characterId,
                },
            });
        });
    }
    /**
     * Get figurine by NFC UID
     */
    async getFigurineByNfcUid(nfcUid) {
        return database_1.prisma.figurine.findUnique({
            where: { nfcUid },
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
    }
    /**
     * Get all figurines owned by a user
     */
    async getUserFigurines(userId) {
        return database_1.prisma.figurine.findMany({
            where: { ownerId: userId },
            include: {
                linkedCharacter: {
                    select: {
                        id: true,
                        name: true,
                        class: true,
                        level: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
exports.FigurineService = FigurineService;
exports.figurineService = new FigurineService();
//# sourceMappingURL=figurineService.js.map