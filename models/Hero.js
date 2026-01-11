const mongoose = require('mongoose');

/**
 * WarChain Hero Schema
 * Combines D&D Beyond character data with Acquisitions Inc business stats
 */
const HeroSchema = new mongoose.Schema({
  // Unique Internal ID for NFC Tag
  nfcId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // D&D Beyond Character ID
  dndBeyondId: {
    type: String,
    required: true,
    index: true
  },
  
  // Character Identity
  name: {
    type: String,
    required: true
  },
  race: String,
  class: String,
  level: {
    type: Number,
    default: 1
  },
  background: String,
  alignment: String,
  
  // Core D&D Stats
  stats: {
    strength: { type: Number, default: 10 },
    dexterity: { type: Number, default: 10 },
    constitution: { type: Number, default: 10 },
    intelligence: { type: Number, default: 10 },
    wisdom: { type: Number, default: 10 },
    charisma: { type: Number, default: 10 }
  },
  
  // Combat Stats
  combat: {
    hitPoints: { type: Number, default: 0 },
    maxHitPoints: { type: Number, default: 0 },
    armorClass: { type: Number, default: 10 },
    speed: { type: Number, default: 30 },
    initiative: { type: Number, default: 0 }
  },
  
  // Skills (simplified)
  skills: [{
    name: String,
    proficiency: Boolean,
    modifier: Number
  }],
  
  // Equipment & Inventory
  equipment: [{
    name: String,
    type: String,
    quantity: Number
  }],
  
  // Spells (if applicable)
  spells: [{
    name: String,
    level: Number,
    prepared: Boolean
  }],
  
  // Acquisitions Inc Business Stats
  business: {
    shopLevel: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    },
    dailyRevenue: {
      type: Number,
      default: 100
    },
    totalGold: {
      type: Number,
      default: 0
    },
    guildRole: {
      type: String,
      enum: ['Apprentice', 'Manager', 'Owner', 'CEO'],
      default: 'Apprentice'
    },
    franchises: {
      type: Number,
      default: 0
    },
    legacy: {
      type: String,
      default: 'None'
    }
  },
  
  // Data Integrity
  dataHash: {
    type: String,
    required: true
  },
  
  // Metadata
  lastSynced: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
HeroSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
HeroSchema.index({ nfcId: 1 });
HeroSchema.index({ dndBeyondId: 1 });

module.exports = mongoose.model('Hero', HeroSchema);

