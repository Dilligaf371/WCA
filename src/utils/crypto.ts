import { createHash } from 'crypto';

/**
 * Generate SHA-256 hash of data
 * Used for character data integrity and D&D Beyond sync comparison
 */
export function hashData(data: unknown): string {
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
  return createHash('sha256').update(jsonString, 'utf8').digest('hex');
}

/**
 * Compare two hashes in constant time to prevent timing attacks
 */
export function compareHashes(hash1: string, hash2: string): boolean {
  if (hash1.length !== hash2.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < hash1.length; i++) {
    result |= hash1.charCodeAt(i) ^ hash2.charCodeAt(i);
  }
  return result === 0;
}
