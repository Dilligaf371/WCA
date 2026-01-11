const express = require('express');
const router = express.Router();
const Hero = require('../models/Hero');
const { ingestCharacter, resyncCharacter } = require('../services/ingestion');
const { generateDataHash, verifyDataIntegrity } = require('../services/blockchain');

/**
 * GET /hero/:nfcId
 * Returns the character sheet for Unity game client
 * Optimized for mobile game consumption
 */
router.get('/:nfcId', async (req, res) => {
  try {
    const { nfcId } = req.params;
    
    const hero = await Hero.findOne({ nfcId });
    
    if (!hero) {
      return res.status(404).json({
        success: false,
        error: 'Hero not found',
        message: `No character found with NFC ID: ${nfcId}`
      });
    }
    
    // Verify data integrity
    const isIntact = verifyDataIntegrity(hero.toObject(), hero.dataHash);
    
    // Format response for Unity client
    const response = {
      success: true,
      data: {
        nfcId: hero.nfcId,
        name: hero.name,
        race: hero.race,
        class: hero.class,
        level: hero.level,
        background: hero.background,
        alignment: hero.alignment,
        stats: hero.stats,
        combat: hero.combat,
        skills: hero.skills,
        equipment: hero.equipment,
        spells: hero.spells,
        business: hero.business,
        dataHash: hero.dataHash,
        dataIntegrity: isIntact,
        lastSynced: hero.lastSynced,
        updatedAt: hero.updatedAt
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error(`[Routes] Error fetching hero:`, error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /hero/sync
 * Re-syncs character data with D&D Beyond
 * Body: { nfcId: "NFC-..." } or { dndBeyondId: "157991391" }
 */
router.post('/sync', async (req, res) => {
  try {
    const { nfcId, dndBeyondId } = req.body;
    
    if (!nfcId && !dndBeyondId) {
      return res.status(400).json({
        success: false,
        error: 'Missing parameters',
        message: 'Either nfcId or dndBeyondId must be provided'
      });
    }
    
    let hero;
    
    if (nfcId) {
      // Re-sync existing hero by NFC ID
      hero = await resyncCharacter(nfcId);
    } else {
      // Ingest new character or update existing by D&D Beyond ID
      hero = await ingestCharacter(dndBeyondId);
    }
    
    res.json({
      success: true,
      message: 'Character synced successfully',
      data: {
        nfcId: hero.nfcId,
        name: hero.name,
        lastSynced: hero.lastSynced,
        dataHash: hero.dataHash
      }
    });
  } catch (error) {
    console.error(`[Routes] Error syncing hero:`, error);
    res.status(500).json({
      success: false,
      error: 'Sync failed',
      message: error.message
    });
  }
});

/**
 * PATCH /hero/update
 * Updates business/combat stats after a game session
 * Body: { nfcId: "NFC-...", updates: { business: {...}, combat: {...} } }
 */
router.patch('/update', async (req, res) => {
  try {
    const { nfcId, updates } = req.body;
    
    if (!nfcId) {
      return res.status(400).json({
        success: false,
        error: 'Missing nfcId',
        message: 'nfcId is required'
      });
    }
    
    if (!updates || (Object.keys(updates).length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Missing updates',
        message: 'Updates object is required'
      });
    }
    
    const hero = await Hero.findOne({ nfcId });
    
    if (!hero) {
      return res.status(404).json({
        success: false,
        error: 'Hero not found',
        message: `No character found with NFC ID: ${nfcId}`
      });
    }
    
    // Update business stats if provided
    if (updates.business) {
      Object.assign(hero.business, updates.business);
    }
    
    // Update combat stats if provided
    if (updates.combat) {
      Object.assign(hero.combat, updates.combat);
    }
    
    // Update equipment if provided
    if (updates.equipment) {
      hero.equipment = updates.equipment;
    }
    
    // Regenerate data hash after updates
    const updatedData = hero.toObject();
    hero.dataHash = generateDataHash(updatedData);
    
    await hero.save();
    
    res.json({
      success: true,
      message: 'Hero updated successfully',
      data: {
        nfcId: hero.nfcId,
        name: hero.name,
        business: hero.business,
        combat: hero.combat,
        dataHash: hero.dataHash,
        updatedAt: hero.updatedAt
      }
    });
  } catch (error) {
    console.error(`[Routes] Error updating hero:`, error);
    res.status(500).json({
      success: false,
      error: 'Update failed',
      message: error.message
    });
  }
});

/**
 * GET /hero
 * List all heroes (useful for admin/debugging)
 */
router.get('/', async (req, res) => {
  try {
    const heroes = await Hero.find({})
      .select('nfcId name class level business.lastSynced')
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json({
      success: true,
      count: heroes.length,
      data: heroes
    });
  } catch (error) {
    console.error(`[Routes] Error listing heroes:`, error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;

