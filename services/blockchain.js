const crypto = require('crypto');

/**
 * Generate SHA-256 hash of hero data for blockchain anchoring
 * This hash will be used for future Polygon blockchain integration
 * @param {Object} heroData - Hero object to hash
 * @returns {String} SHA-256 hash in hex format
 */
function generateDataHash(heroData) {
  // Create a clean copy without metadata fields that change
  const hashableData = {
    nfcId: heroData.nfcId,
    dndBeyondId: heroData.dndBeyondId,
    name: heroData.name,
    race: heroData.race,
    class: heroData.class,
    level: heroData.level,
    background: heroData.background,
    alignment: heroData.alignment,
    stats: heroData.stats,
    combat: heroData.combat,
    skills: heroData.skills,
    equipment: heroData.equipment,
    spells: heroData.spells,
    business: heroData.business
  };
  
  // Convert to JSON string with sorted keys for consistency
  const jsonString = JSON.stringify(hashableData, Object.keys(hashableData).sort());
  
  // Generate SHA-256 hash
  const hash = crypto.createHash('sha256');
  hash.update(jsonString);
  
  return hash.digest('hex');
}

/**
 * Verify data integrity by comparing current hash with stored hash
 * @param {Object} heroData - Hero object to verify
 * @param {String} storedHash - Previously stored hash
 * @returns {Boolean} True if data is intact, false otherwise
 */
function verifyDataIntegrity(heroData, storedHash) {
  const currentHash = generateDataHash(heroData);
  return currentHash === storedHash;
}

/**
 * Prepare hero data for blockchain anchoring
 * Returns a minimal payload optimized for Polygon transaction
 * @param {Object} hero - Hero document
 * @returns {Object} Blockchain-ready payload
 */
function prepareBlockchainPayload(hero) {
  return {
    nfcId: hero.nfcId,
    name: hero.name,
    level: hero.level,
    class: hero.class,
    dataHash: hero.dataHash,
    timestamp: hero.updatedAt.getTime()
  };
}

module.exports = {
  generateDataHash,
  verifyDataIntegrity,
  prepareBlockchainPayload
};

