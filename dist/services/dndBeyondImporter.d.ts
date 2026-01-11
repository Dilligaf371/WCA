import type { DndBeyondCharacter, NormalizedCharacter } from '../types/dndBeyond';
/**
 * D&D Beyond Import Service
 *
 * ASSUMPTION: D&D Beyond does not have a public API.
 * This service assumes one of the following:
 * 1. Authenticated scraping service provides JSON
 * 2. Proxy service handles authentication and returns normalized data
 * 3. Manual JSON upload via API endpoint (see routes)
 *
 * In production, replace fetchCharacterFromApi with actual implementation.
 */
export declare class DndBeyondImporter {
    private apiClient;
    constructor();
    /**
     * Fetch character data from D&D Beyond
     * Tries to fetch from public JSON endpoint (characterUrl/json)
     */
    fetchCharacterFromApi(characterId: string, characterUrl?: string): Promise<DndBeyondCharacter>;
    /**
     * Normalize D&D Beyond character data into WCA canonical format
     * Handles various D&D Beyond data structures and edge cases
     */
    normalizeCharacter(rawData: any): NormalizedCharacter;
    /**
     * Import character from D&D Beyond into WCA
     * Creates or updates character, stores raw data snapshot, and tracks sync status
     */
    importCharacter(userId: string, dndBeyondCharacterId: string, rawData?: DndBeyondCharacter, characterUrl?: string): Promise<{
        characterId: string;
        isNew: boolean;
        isUpdated: boolean;
    }>;
    /**
     * Check if character needs sync by comparing hashes
     */
    checkSyncStatus(characterId: string): Promise<{
        needsSync: boolean;
        currentHash: string | null;
        dndBeyondHash?: string;
    }>;
}
export declare const dndBeyondImporter: DndBeyondImporter;
//# sourceMappingURL=dndBeyondImporter.d.ts.map