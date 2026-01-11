"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dndBeyondImporter = exports.DndBeyondImporter = void 0;
const axios_1 = __importDefault(require("axios"));
const database_1 = require("../config/database");
const crypto_1 = require("../utils/crypto");
const client_1 = require("@prisma/client");
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
class DndBeyondImporter {
    apiClient = null;
    constructor() {
        const apiUrl = process.env.DND_BEYOND_API_URL;
        const apiKey = process.env.DND_BEYOND_API_KEY;
        if (apiUrl && apiKey) {
            this.apiClient = axios_1.default.create({
                baseURL: apiUrl,
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            });
        }
    }
    /**
     * Fetch character data from D&D Beyond
     * Tries to fetch from public JSON endpoint (characterUrl/json)
     */
    async fetchCharacterFromApi(characterId, characterUrl) {
        // Try to fetch from public JSON endpoint if URL provided
        if (characterUrl) {
            try {
                const jsonUrl = characterUrl.replace(/\/$/, '') + '/json';
                const response = await axios_1.default.get(jsonUrl, {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (compatible; WarChain-Arena/1.0)',
                        'Referer': characterUrl,
                    },
                    timeout: 15000,
                    maxRedirects: 5,
                });
                if (response.data && response.data.id) {
                    return response.data;
                }
                throw new Error('Invalid JSON response from D&D Beyond');
            }
            catch (error) {
                if (axios_1.default.isAxiosError(error)) {
                    if (error.response?.status === 403 || error.response?.status === 401) {
                        throw new Error('Unable to access character sheet. Please ensure the character sheet is set to PUBLIC in D&D Beyond settings.');
                    }
                    if (error.response?.status === 404) {
                        throw new Error('Character not found. Please check the URL and ensure the character exists.');
                    }
                    throw new Error(`Failed to fetch character data: ${error.message}`);
                }
                throw error;
            }
        }
        // Fall back to configured API if available
        if (this.apiClient) {
            try {
                const response = await this.apiClient.get(`/characters/${characterId}`);
                return response.data;
            }
            catch (error) {
                if (axios_1.default.isAxiosError(error)) {
                    throw new Error(`Failed to fetch character from D&D Beyond API: ${error.message}`);
                }
                throw error;
            }
        }
        throw new Error('Character URL is required. Please provide the full D&D Beyond character sheet URL.');
    }
    /**
     * Normalize D&D Beyond character data into WCA canonical format
     * Handles various D&D Beyond data structures and edge cases
     */
    normalizeCharacter(rawData) {
        // Handle different JSON structures - D&D Beyond may return nested data
        const data = rawData.data || rawData;
        // Log campaign data for debugging
        console.log('[DndBeyondImporter] Campaign debugging:', {
            hasDataCampaign: !!data.campaign,
            hasRawDataCampaign: !!rawData.campaign,
            dataCampaign: data.campaign,
            rawDataCampaign: rawData.campaign,
            dataCampaignName: data.campaignName,
            rawDataCampaignName: rawData.campaignName,
            allDataKeys: Object.keys(data).filter(k => k.toLowerCase().includes('campaign')),
            allRawDataKeys: Object.keys(rawData).filter(k => k.toLowerCase().includes('campaign'))
        });
        // Extract class name (handle multiclass and various formats)
        let className = 'Unknown';
        if (data.classes && Array.isArray(data.classes) && data.classes.length > 0) {
            const primaryClass = data.classes[0];
            // Try multiple paths for class name
            className = primaryClass.definition?.name ||
                primaryClass.class?.definition?.name ||
                primaryClass.class?.name ||
                primaryClass.name ||
                'Unknown';
            if (primaryClass.subclass) {
                const subclassName = primaryClass.subclass.definition?.name ||
                    primaryClass.subclass.name;
                if (subclassName) {
                    className = `${className} (${subclassName})`;
                }
            }
            // Add other classes if multiclass
            if (data.classes.length > 1) {
                const otherClasses = data.classes.slice(1)
                    .map((c) => {
                    const cName = c.definition?.name || c.class?.definition?.name || c.class?.name || c.name || 'Unknown';
                    return `${cName} ${c.level || ''}`;
                })
                    .join(' / ');
                className = `${className} / ${otherClasses}`;
            }
        }
        else if (data.class?.definition?.name) {
            className = data.class.definition.name;
            if (data.class.subclass?.definition?.name) {
                className = `${className} (${data.class.subclass.definition.name})`;
            }
        }
        else if (data.class?.name) {
            className = data.class.name;
            if (data.class.subclass?.name) {
                className = `${className} (${data.class.subclass.name})`;
            }
        }
        else if (data.className) {
            className = data.className;
        }
        // Extract and calculate base stats - handle multiple formats
        const statsMap = {};
        if (data.stats) {
            data.stats.forEach((stat) => {
                const id = stat.id || stat.statId;
                const value = stat.value !== undefined ? stat.value : stat.baseValue;
                if (id)
                    statsMap[id] = value;
            });
        }
        // Alternative format: direct stat values
        if (data.strength !== undefined)
            statsMap[1] = data.strength;
        if (data.dexterity !== undefined)
            statsMap[2] = data.dexterity;
        if (data.constitution !== undefined)
            statsMap[3] = data.constitution;
        if (data.intelligence !== undefined)
            statsMap[4] = data.intelligence;
        if (data.wisdom !== undefined)
            statsMap[5] = data.wisdom;
        if (data.charisma !== undefined)
            statsMap[6] = data.charisma;
        // Apply modifiers if present
        if (data.modifiers?.race) {
            data.modifiers.race.forEach((mod) => {
                if (statsMap[mod.statId] !== undefined) {
                    statsMap[mod.statId] += mod.value;
                }
            });
        }
        if (data.modifiers?.class) {
            data.modifiers.class.forEach((mod) => {
                if (statsMap[mod.statId] !== undefined) {
                    statsMap[mod.statId] += mod.value;
                }
            });
        }
        // Map stat IDs to names (1=STR, 2=DEX, 3=CON, 4=INT, 5=WIS, 6=CHA)
        const baseStats = {
            str: statsMap[1] || data.strength || 10,
            dex: statsMap[2] || data.dexterity || 10,
            con: statsMap[3] || data.constitution || 10,
            int: statsMap[4] || data.intelligence || 10,
            wis: statsMap[5] || data.wisdom || 10,
            cha: statsMap[6] || data.charisma || 10,
        };
        // Calculate level - handle multiclass (sum of all class levels)
        let level = 1;
        if (data.classes && Array.isArray(data.classes) && data.classes.length > 0) {
            // Sum all class levels for multiclass
            level = data.classes.reduce((sum, c) => sum + (c.level || 0), 0);
        }
        else if (data.level !== undefined) {
            level = data.level;
        }
        else if (data.characterLevel !== undefined) {
            level = data.characterLevel;
        }
        else if (data.class?.level !== undefined) {
            level = data.class.level;
        }
        // Ensure level is at least 1
        level = Math.max(1, level);
        const proficiency = Math.ceil(level / 4) + 1;
        // Calculate derived stats
        const conModifier = Math.floor((baseStats.con - 10) / 2);
        const baseHP = data.hitPoints?.max || data.hitPointsMax || data.maxHp || (level * 8 + conModifier);
        const derivedStats = {
            hp: baseHP,
            ac: data.armorClass || data.ac || 10 + Math.floor((baseStats.dex - 10) / 2),
            speed: data.speed || data.walkSpeed || 30,
            initiative: Math.floor((baseStats.dex - 10) / 2),
            proficiency,
        };
        // Normalize equipment - D&D Beyond may store items in various locations
        console.log('[DndBeyondImporter] Extracting equipment from:', {
            hasEquipment: !!data.equipment,
            hasItems: !!data.items,
            hasInventory: !!data.inventory,
            hasEquippedItems: !!data.equippedItems,
            equipmentType: typeof data.equipment,
            itemsType: typeof data.items,
            inventoryType: typeof data.inventory,
        });
        // Try multiple possible locations for equipment/items
        let itemsArray = [];
        if (Array.isArray(data.equipment)) {
            itemsArray = data.equipment;
        }
        else if (Array.isArray(data.items)) {
            itemsArray = data.items;
        }
        else if (Array.isArray(data.inventory)) {
            itemsArray = data.inventory;
        }
        else if (data.inventory && typeof data.inventory === 'object') {
            // D&D Beyond stores inventory as an object with numeric keys, convert to array
            itemsArray = Object.values(data.inventory);
        }
        else if (Array.isArray(data.equippedItems)) {
            itemsArray = data.equippedItems;
        }
        else if (data.inventory?.items && Array.isArray(data.inventory.items)) {
            itemsArray = data.inventory.items;
        }
        else if (data.equipment?.items && Array.isArray(data.equipment.items)) {
            itemsArray = data.equipment.items;
        }
        console.log('[DndBeyondImporter] Found items array:', itemsArray.length, 'items');
        const equipment = itemsArray.map((item) => {
            // Check if item is equipped - D&D Beyond uses item.equipped boolean
            const isEquipped = item.equipped === true;
            // Extract name from definition.name (D&D Beyond structure)
            const itemName = item.definition?.name || item.name || item.itemName || 'Unknown Item';
            return {
                name: itemName,
                quantity: item.quantity || item.count || 1,
                equipped: isEquipped,
            };
        });
        console.log('[DndBeyondImporter] Normalized equipment:', equipment.length, 'items,', equipment.filter(i => i.equipped).length, 'equipped');
        // Normalize spells - handle different formats (array, object, or missing)
        let spells = undefined;
        if (data.spells) {
            if (Array.isArray(data.spells)) {
                // Spells is an array
                spells = data.spells.map((spell) => ({
                    name: spell.name || spell.spellName || 'Unknown Spell',
                    level: spell.level || spell.spellLevel || 0,
                    school: spell.school || spell.schoolName,
                }));
            }
            else if (typeof data.spells === 'object') {
                // Spells might be an object (e.g., {level1: [...], level2: [...]})
                // Flatten into a single array
                const spellsArray = [];
                Object.values(data.spells).forEach((spellGroup) => {
                    if (Array.isArray(spellGroup)) {
                        spellsArray.push(...spellGroup);
                    }
                });
                spells = spellsArray.map((spell) => ({
                    name: spell.name || spell.spellName || 'Unknown Spell',
                    level: spell.level || spell.spellLevel || 0,
                    school: spell.school || spell.schoolName,
                }));
            }
        }
        // Extract campaign name - D&D Beyond stores it in various places
        let campaign = null;
        if (data.campaign) {
            campaign = data.campaign.name || data.campaign.campaignName || data.campaign.title || null;
        }
        else if (data.campaignName) {
            campaign = data.campaignName;
        }
        else if (data.campaignData?.name) {
            campaign = data.campaignData.name;
        }
        else if (rawData.campaign?.name) {
            campaign = rawData.campaign.name;
        }
        else if (rawData.campaignName) {
            campaign = rawData.campaignName;
        }
        console.log('[DndBeyondImporter] Campaign extraction:', {
            found: !!campaign,
            campaign,
            hasDataCampaign: !!data.campaign,
            dataCampaignKeys: data.campaign ? Object.keys(data.campaign) : [],
            rawDataCampaignKeys: rawData.campaign ? Object.keys(rawData.campaign) : []
        });
        return {
            name: data.name || data.characterName || rawData.name || 'Unnamed Character',
            class: className,
            level,
            race: data.race?.fullName || data.race?.name || data.raceName,
            background: data.background?.name || data.backgroundName,
            alignment: data.alignment,
            campaign,
            baseStats,
            derivedStats,
            equipment,
            spells,
        };
    }
    /**
     * Import character from D&D Beyond into WCA
     * Creates or updates character, stores raw data snapshot, and tracks sync status
     */
    async importCharacter(userId, dndBeyondCharacterId, rawData, characterUrl) {
        // Ensure dndBeyondCharacterId is a string (Prisma requires String type)
        const dndBeyondId = String(dndBeyondCharacterId || '');
        console.log('[DndBeyondImporter] importCharacter called:', {
            userId,
            dndBeyondCharacterId: dndBeyondId,
            hasRawData: !!rawData,
            rawDataType: typeof rawData,
            rawDataKeys: rawData && typeof rawData === 'object' ? Object.keys(rawData) : 'N/A'
        });
        // Use raw data if provided, otherwise try to fetch
        let characterData = rawData;
        if (!characterData) {
            try {
                characterData = await this.fetchCharacterFromApi(dndBeyondId, characterUrl);
            }
            catch (error) {
                // If fetch fails, provide a helpful error message
                throw new Error('Unable to fetch character data from D&D Beyond. ' +
                    'Please use the "Depuis JSON" option and paste the character data manually, ' +
                    'or ensure the character sheet is public and accessible.');
            }
        }
        console.log('[DndBeyondImporter] characterData before normalization:', {
            hasId: !!characterData.id,
            id: characterData.id,
            idType: typeof characterData.id,
            hasName: !!characterData.name,
            keys: Object.keys(characterData || {})
        });
        // Ensure we have an ID in the character data, and convert it to string
        if (!characterData.id) {
            characterData.id = dndBeyondId;
            console.log('[DndBeyondImporter] Set id from dndBeyondCharacterId:', dndBeyondId);
        }
        else {
            // Convert ID to string if it's a number
            characterData.id = String(characterData.id);
        }
        // Normalize data
        console.log('[DndBeyondImporter] Calling normalizeCharacter...');
        let normalized;
        try {
            normalized = this.normalizeCharacter(characterData);
            console.log('[DndBeyondImporter] Normalization successful:', {
                name: normalized.name,
                class: normalized.class,
                level: normalized.level
            });
        }
        catch (error) {
            console.error('[DndBeyondImporter] Normalization failed:', error);
            throw new Error(`Failed to normalize character data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        // Calculate hash of raw data for comparison
        console.log('[DndBeyondImporter] Calculating hash...');
        const rawHash = (0, crypto_1.hashData)(characterData);
        console.log('[DndBeyondImporter] Hash calculated:', rawHash.substring(0, 20) + '...');
        // Check if character already exists
        const existing = await database_1.prisma.character.findUnique({
            where: { dndBeyondCharacterId: dndBeyondId },
        });
        let isUpdated = false;
        if (existing) {
            // Compare hashes to detect changes
            const hasChanged = !existing.lastDndBeyondHash ||
                !(0, crypto_1.compareHashes)(existing.lastDndBeyondHash, rawHash);
            if (hasChanged) {
                // Update existing character
                await database_1.prisma.character.update({
                    where: { id: existing.id },
                    data: {
                        name: normalized.name,
                        class: normalized.class,
                        level: normalized.level,
                        race: normalized.race,
                        background: normalized.background,
                        alignment: normalized.alignment,
                        campaign: normalized.campaign,
                        baseStats: normalized.baseStats,
                        derivedStats: normalized.derivedStats,
                        equipment: normalized.equipment,
                        spells: normalized.spells,
                        rawImportData: characterData,
                        syncHash: (0, crypto_1.hashData)(normalized),
                        lastDndBeyondHash: rawHash,
                        lastSyncAt: new Date(),
                        syncStatus: client_1.CharacterSyncStatus.SYNCED,
                    },
                });
                isUpdated = true;
            }
            else {
                // No changes, just update sync time
                await database_1.prisma.character.update({
                    where: { id: existing.id },
                    data: {
                        lastSyncAt: new Date(),
                        syncStatus: client_1.CharacterSyncStatus.SYNCED,
                    },
                });
            }
            // Create audit log
            await database_1.prisma.auditLog.create({
                data: {
                    action: client_1.AuditAction.CHARACTER_IMPORT,
                    userId,
                    characterId: existing.id,
                    metadata: {
                        dndBeyondCharacterId,
                        isUpdate: isUpdated,
                    },
                },
            });
            return { characterId: existing.id, isNew: false, isUpdated };
        }
        else {
            // Create new character
            const newCharacter = await database_1.prisma.character.create({
                data: {
                    dndBeyondCharacterId: dndBeyondId,
                    ownerId: userId,
                    name: normalized.name,
                    class: normalized.class,
                    level: normalized.level,
                    race: normalized.race,
                    background: normalized.background,
                    alignment: normalized.alignment,
                    campaign: normalized.campaign,
                    baseStats: normalized.baseStats,
                    derivedStats: normalized.derivedStats,
                    equipment: normalized.equipment,
                    spells: normalized.spells,
                    rawImportData: characterData,
                    syncHash: (0, crypto_1.hashData)(normalized),
                    lastDndBeyondHash: rawHash,
                    lastSyncAt: new Date(),
                    syncStatus: client_1.CharacterSyncStatus.SYNCED,
                },
            });
            // Create audit log
            await database_1.prisma.auditLog.create({
                data: {
                    action: client_1.AuditAction.CHARACTER_IMPORT,
                    userId,
                    characterId: newCharacter.id,
                    metadata: {
                        dndBeyondCharacterId,
                        isUpdate: false,
                    },
                },
            });
            return { characterId: newCharacter.id, isNew: true, isUpdated: false };
        }
    }
    /**
     * Check if character needs sync by comparing hashes
     */
    async checkSyncStatus(characterId) {
        const character = await database_1.prisma.character.findUnique({
            where: { id: characterId },
            select: {
                lastDndBeyondHash: true,
                dndBeyondCharacterId: true,
            },
        });
        if (!character || !character.dndBeyondCharacterId) {
            return { needsSync: false, currentHash: character?.lastDndBeyondHash || null };
        }
        try {
            const rawData = await this.fetchCharacterFromApi(character.dndBeyondCharacterId);
            const newHash = (0, crypto_1.hashData)(rawData);
            const needsSync = !character.lastDndBeyondHash ||
                !(0, crypto_1.compareHashes)(character.lastDndBeyondHash, newHash);
            return {
                needsSync,
                currentHash: character.lastDndBeyondHash,
                dndBeyondHash: newHash,
            };
        }
        catch (error) {
            console.error(`[DndBeyondImporter] Failed to check sync status:`, error);
            return {
                needsSync: false,
                currentHash: character.lastDndBeyondHash,
            };
        }
    }
}
exports.DndBeyondImporter = DndBeyondImporter;
exports.dndBeyondImporter = new DndBeyondImporter();
//# sourceMappingURL=dndBeyondImporter.js.map