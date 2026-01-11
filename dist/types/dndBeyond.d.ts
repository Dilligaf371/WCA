/**
 * Type definitions for D&D Beyond character data
 * Based on D&D Beyond API structure (as best we can infer without official docs)
 *
 * ASSUMPTION: D&D Beyond does not have a public API.
 * This structure assumes either:
 * 1. Scraped data from authenticated sessions
 * 2. Proxy service providing normalized JSON
 * 3. Manual JSON upload via API endpoint
 */
export interface DndBeyondCharacter {
    id: string;
    name: string;
    race?: {
        fullName: string;
        id?: number;
    };
    class?: {
        name: string;
        id?: number;
        level?: number;
    };
    classes?: Array<{
        class: {
            name: string;
            id?: number;
        };
        subclass?: {
            name: string;
            id?: number;
        };
        level: number;
    }>;
    level: number;
    background?: {
        name: string;
        id?: number;
    };
    alignment?: string;
    stats?: Array<{
        id: number;
        value: number;
        modifier?: number;
    }>;
    modifiers?: {
        race?: Array<{
            statId: number;
            value: number;
        }>;
        class?: Array<{
            statId: number;
            value: number;
        }>;
    };
    hitPoints?: {
        max?: number;
        current?: number;
        temp?: number;
    };
    armorClass?: number;
    speed?: number;
    proficiencies?: {
        skills?: Array<{
            skillId: number;
            proficiencyType?: number;
        }>;
    };
    equipment?: Array<{
        id?: number;
        name: string;
        quantity?: number;
        equipped?: boolean;
        armorClass?: number;
    }>;
    spells?: Array<{
        id?: number;
        name: string;
        level: number;
        school?: string;
    }>;
    customProficiencies?: Array<{
        name: string;
        type: string;
    }>;
}
export interface NormalizedCharacter {
    name: string;
    class: string;
    level: number;
    race?: string;
    background?: string;
    alignment?: string;
    campaign?: string | null;
    baseStats: {
        str: number;
        dex: number;
        con: number;
        int: number;
        wis: number;
        cha: number;
    };
    derivedStats: {
        hp: number;
        ac: number;
        speed: number;
        initiative: number;
        proficiency: number;
    };
    equipment: Array<{
        name: string;
        quantity: number;
        equipped: boolean;
    }>;
    spells?: Array<{
        name: string;
        level: number;
        school?: string;
    }>;
}
//# sourceMappingURL=dndBeyond.d.ts.map