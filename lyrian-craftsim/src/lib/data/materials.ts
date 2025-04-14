import type { BaseMaterial, SpecialMaterials } from '../types';

// --- Base Materials ---
export const baseMaterials: { [key: string]: BaseMaterial } = {
    iron: { name: 'Iron', effectText: 'None', bonusDice: 0 },
    tamahagane: { name: 'Tamahagane', effectText: '+1 Crafting Dice', bonusDice: 1 },
    mithril: { name: 'Mithril', effectText: '+2 Crafting Dice', bonusDice: 2 },
    orichalcum: { name: 'Orichalcum', effectText: '+3 Crafting Dice', bonusDice: 3 },
    escudo: { name: 'Escudo', effectText: '+4 Crafting Dice', bonusDice: 4 }
};

// --- Special Materials ---
export const specialMaterials: SpecialMaterials = {
    'cold-iron': {
        point_cost: 15,
        dice_cost: 0,
        effect: 'Strikes cause target to be unable to teleport until end of their next turn.'
    },
    silver: {
        point_cost: 20,
        dice_cost: 0,
        effect: 'Disables Regeneration of Fiends until start of your next turn.'
    },
    electrum: {
        point_cost: 30,
        dice_cost: 0,
        effect: '+2 Electrum Power bonus against Divines Summons or Otherworlders.'
    },
    feathersteel: {
        point_cost: 15,
        dice_cost: 0,
        effect: 'Incurs 1 less burden (min 0.5).'
    },
    mycelite: {
        point_cost: 20,
        dice_cost: 0,
        effect: 'Incurs 1.5 less burden (min 0.5).'
    },
    titanium: {
        point_cost: 0,
        dice_cost: 0,
        effect: 'Gain +30 Crafting Points.'
    },
    'obsidian-steel': {
        point_cost: 0,
        dice_cost: 0,
        effect: 'Cannot be targeted by magical effects.'
    },
    adamantite: {
        point_cost: 0,
        dice_cost: 0,
        effect: 'Cannot be destroyed by non-adamantite tools or weapons.'
    },
    luxaeterna: {
        point_cost: 15,
        dice_cost: 0,
        effect: 'Changes physical damage to Holy.'
    },
    corvuskite: {
        point_cost: 15,
        dice_cost: 0,
        effect: 'Changes physical damage to Dark.'
    },
    arcanium: {
        point_cost: 15,
        dice_cost: 0,
        effect: 'Changes physical damage to Arcane.'
    },
    vivinthal: {
        point_cost: 15,
        dice_cost: 0,
        effect: 'Changes physical damage to Water.'
    },
    salachar: {
        point_cost: 15,
        dice_cost: 0,
        effect: 'Changes physical damage to Fire.'
    },
    sylphsteel: {
        point_cost: 15,
        dice_cost: 0,
        effect: 'Changes physical damage to Wind.'
    },
    ghimslag: {
        point_cost: 15,
        dice_cost: 0,
        effect: 'Changes physical damage to Earth.'
    }
};
