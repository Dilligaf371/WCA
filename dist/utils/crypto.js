"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashData = hashData;
exports.compareHashes = compareHashes;
const crypto_1 = require("crypto");
/**
 * Generate SHA-256 hash of data
 * Used for character data integrity and D&D Beyond sync comparison
 */
function hashData(data) {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    return (0, crypto_1.createHash)('sha256').update(jsonString, 'utf8').digest('hex');
}
/**
 * Compare two hashes in constant time to prevent timing attacks
 */
function compareHashes(hash1, hash2) {
    if (hash1.length !== hash2.length) {
        return false;
    }
    let result = 0;
    for (let i = 0; i < hash1.length; i++) {
        result |= hash1.charCodeAt(i) ^ hash2.charCodeAt(i);
    }
    return result === 0;
}
//# sourceMappingURL=crypto.js.map