import type { CraftingState } from './types';

// --- Initial State ---
export const initialCraftingState: CraftingState = {
    itemValue: 500,
    craftingHP: 50,
    baseMaterial: 'iron',
    craftingSkill: 5,
    expertise: 10,
    blacksmithLevel: 1,
    forgemasterLevel: 0,
    // Alchemy-specific properties
    alchemistLevel: 1,
    alchemeisterLevel: 0,
    itemType: 'potion', // Default item type
    isHealing: false,
    isDamaging: false,
    isAOE: false,
    // Common properties
    diceRemaining: 5, // Base 5 + material bonus (calculated on init)
    craftingPoints: 0,
    usedActions: [],
    bonuses: [],
    materials: [], // Calculated on init
    alloys: [],
    log: ['Crafting simulator initialized.'],
    initialDice: 5 // Base 5 + material bonus (calculated on init)
};
