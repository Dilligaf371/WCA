const axios = require('axios');
const Hero = require('../models/Hero');
const { generateDataHash } = require('./blockchain');

/**
 * D&D Beyond Character ID for mock ingestion
 */
const MOCK_CHARACTER_ID = '157991391';

/**
 * Mock D&D Beyond character data structure
 * In production, this would be fetched from D&D Beyond API
 */
const MOCK_DND_BEYOND_DATA = {
  id: MOCK_CHARACTER_ID,
  name: 'Thorin Ironforge',
  race: { name: 'Dwarf', subrace: 'Mountain Dwarf' },
  class: { name: 'Fighter', level: 5 },
  background: 'Guild Artisan',
  alignment: 'Lawful Good',
  stats: {
    strength: 16,
    dexterity: 12,
    constitution: 15,
    intelligence: 10,
    wisdom: 13,
    charisma: 14
  },
  hitPoints: { current: 45, maximum: 45 },
  armorClass: 18,
  speed: 25,
  skills: [
    { name: 'Athletics', proficiency: true, ability: 'strength' },
    { name: 'History', proficiency: true, ability: 'intelligence' },
    { name: 'Insight', proficiency: true, ability: 'wisdom' },
    { name: 'Persuasion', proficiency: true, ability: 'charisma' }
  ],
  equipment: [
    { name: 'Plate Armor', type: 'Armor', quantity: 1 },
    { name: 'Warhammer', type: 'Weapon', quantity: 1 },
    { name: 'Shield', type: 'Armor', quantity: 1 },
    { name: 'Backpack', type: 'Adventuring Gear', quantity: 1 }
  ],
  spells: []
};

/**
 * Transform D&D Beyond JSON to WarChain Hero format
 * @param {Object} dndData - Raw D&D Beyond character data
 * @param {String} nfcId - Unique NFC identifier
 * @returns {Object} WarChain-formatted hero data
 */
function transformDndBeyondToWarChain(dndData, nfcId) {
  // Calculate skill modifiers (simplified)
  const calculateModifier = (stat) => Math.floor((stat - 10) / 2);
  
  const transformedSkills = (dndData.skills || []).map(skill => ({
    name: skill.name,
    proficiency: skill.proficiency || false,
    modifier: calculateModifier(dndData.stats[skill.ability]) + (skill.proficiency ? 2 : 0)
  }));

  return {
    nfcId: nfcId,
    dndBeyondId: dndData.id.toString(),
    name: dndData.name,
    race: dndData.race?.name || dndData.race || 'Unknown',
    class: dndData.class?.name || dndData.class || 'Unknown',
    level: dndData.class?.level || dndData.level || 1,
    background: dndData.background || 'Unknown',
    alignment: dndData.alignment || 'Unaligned',
    stats: {
      strength: dndData.stats.strength || 10,
      dexterity: dndData.stats.dexterity || 10,
      constitution: dndData.stats.constitution || 10,
      intelligence: dndData.stats.intelligence || 10,
      wisdom: dndData.stats.wisdom || 10,
      charisma: dndData.stats.charisma || 10
    },
    combat: {
      hitPoints: dndData.hitPoints?.current || 0,
      maxHitPoints: dndData.hitPoints?.maximum || dndData.hitPoints?.current || 0,
      armorClass: dndData.armorClass || 10,
      speed: dndData.speed || 30,
      initiative: calculateModifier(dndData.stats.dexterity || 10)
    },
    skills: transformedSkills,
    equipment: (dndData.equipment || []).map(item => ({
      name: item.name,
      type: item.type || 'Unknown',
      quantity: item.quantity || 1
    })),
    spells: (dndData.spells || []).map(spell => ({
      name: spell.name,
      level: spell.level || 0,
      prepared: spell.prepared || false
    })),
    business: {
      shopLevel: 1,
      dailyRevenue: 100,
      totalGold: 0,
      guildRole: 'Apprentice',
      franchises: 0,
      legacy: 'None'
    }
  };
}

/**
 * Fetch character data from D&D Beyond API
 * Currently uses mock data, but structured for real API integration
 * @param {String} characterId - D&D Beyond character ID
 * @returns {Promise<Object>} Character data
 */
async function fetchDndBeyondCharacter(characterId) {
  try {
    // TODO: Replace with actual D&D Beyond API call when available
    // const response = await axios.get(`https://www.dndbeyond.com/api/character/${characterId}`, {
    //   headers: {
    //     'Authorization': `Bearer ${process.env.DND_BEYOND_API_KEY}`
    //   }
    // });
    // return response.data;
    
    // Mock implementation for POC
    console.log(`[Ingestion] Using mock data for character ID: ${characterId}`);
    return MOCK_DND_BEYOND_DATA;
  } catch (error) {
    console.error(`[Ingestion] Error fetching D&D Beyond character ${characterId}:`, error.message);
    throw new Error(`Failed to fetch character from D&D Beyond: ${error.message}`);
  }
}

/**
 * Ingest and store a character from D&D Beyond
 * @param {String} characterId - D&D Beyond character ID
 * @param {String} nfcId - Unique NFC identifier (optional, will generate if not provided)
 * @returns {Promise<Object>} Created/updated Hero document
 */
async function ingestCharacter(characterId, nfcId = null) {
  try {
    // Generate NFC ID if not provided
    if (!nfcId) {
      nfcId = `NFC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Fetch character data from D&D Beyond
    const dndData = await fetchDndBeyondCharacter(characterId);
    
    // Transform to WarChain format
    const warChainData = transformDndBeyondToWarChain(dndData, nfcId);
    
    // Generate data integrity hash
    const dataHash = generateDataHash(warChainData);
    warChainData.dataHash = dataHash;
    
    // Check if hero already exists
    const existingHero = await Hero.findOne({ 
      $or: [
        { nfcId: nfcId },
        { dndBeyondId: characterId.toString() }
      ]
    });
    
    if (existingHero) {
      // Update existing hero
      Object.assign(existingHero, warChainData);
      existingHero.lastSynced = new Date();
      await existingHero.save();
      console.log(`[Ingestion] Updated hero: ${existingHero.name} (NFC: ${nfcId})`);
      return existingHero;
    } else {
      // Create new hero
      const hero = new Hero(warChainData);
      await hero.save();
      console.log(`[Ingestion] Created new hero: ${hero.name} (NFC: ${nfcId})`);
      return hero;
    }
  } catch (error) {
    console.error('[Ingestion] Error ingesting character:', error);
    throw error;
  }
}

/**
 * Re-sync a character with D&D Beyond
 * @param {String} nfcId - NFC identifier
 * @returns {Promise<Object>} Updated Hero document
 */
async function resyncCharacter(nfcId) {
  try {
    const hero = await Hero.findOne({ nfcId });
    if (!hero) {
      throw new Error(`Hero with NFC ID ${nfcId} not found`);
    }
    
    return await ingestCharacter(hero.dndBeyondId, nfcId);
  } catch (error) {
    console.error(`[Ingestion] Error resyncing character ${nfcId}:`, error);
    throw error;
  }
}

module.exports = {
  ingestCharacter,
  resyncCharacter,
  fetchDndBeyondCharacter,
  transformDndBeyondToWarChain,
  MOCK_CHARACTER_ID
};

