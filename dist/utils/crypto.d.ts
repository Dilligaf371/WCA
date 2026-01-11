/**
 * Generate SHA-256 hash of data
 * Used for character data integrity and D&D Beyond sync comparison
 */
export declare function hashData(data: unknown): string;
/**
 * Compare two hashes in constant time to prevent timing attacks
 */
export declare function compareHashes(hash1: string, hash2: string): boolean;
//# sourceMappingURL=crypto.d.ts.map