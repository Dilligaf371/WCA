export declare class FigurineService {
    /**
     * Bind an NFC UID to a user account
     * Enforces one-to-one binding and prevents race conditions with Redis locking
     *
     * @param userId User ID binding the figurine
     * @param nfcUid Unique NFC tag identifier
     * @param characterId Optional character to link to figurine
     * @returns Created figurine record
     */
    bindFigurine(userId: string, nfcUid: string, characterId?: string): Promise<{
        id: string;
        nfcUid: string;
        tokenId: bigint | null;
    }>;
    /**
     * Unbind a figurine from a character (but keep NFC binding to user)
     * Only allowed by figurine owner
     */
    unbindCharacter(userId: string, figurineId: string): Promise<void>;
    /**
     * Link a character to an existing figurine
     * Requires ownership of both figurine and character
     */
    linkCharacter(userId: string, figurineId: string, characterId: string): Promise<void>;
    /**
     * Get figurine by NFC UID
     */
    getFigurineByNfcUid(nfcUid: string): Promise<({
        owner: {
            id: string;
            email: string;
            walletAddress: string | null;
        };
        linkedCharacter: {
            name: string;
            id: string;
            class: string;
            level: number;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tokenId: bigint | null;
        nfcUid: string;
        linkedCharacterId: string | null;
        ownerId: string;
        contractAddress: string | null;
        boundAt: Date;
        mintedAt: Date | null;
    }) | null>;
    /**
     * Get all figurines owned by a user
     */
    getUserFigurines(userId: string): Promise<({
        linkedCharacter: {
            name: string;
            id: string;
            class: string;
            level: number;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tokenId: bigint | null;
        nfcUid: string;
        linkedCharacterId: string | null;
        ownerId: string;
        contractAddress: string | null;
        boundAt: Date;
        mintedAt: Date | null;
    })[]>;
}
export declare const figurineService: FigurineService;
//# sourceMappingURL=figurineService.d.ts.map