import type {
CraftingState,
BaseMaterial,
SpecialMaterials,
CraftingActions,
CraftingAction,
SpecialMaterial
} from './types';

// --- Helper Functions ---

/**
 * Rolls a d10.
 * TODO: Add forced roll option later.
 */
function rollD10(): number {
return Math.floor(Math.random() * 10) + 1;
}

/**
 * Performs a standard crafting check.
 */
function performCraftingCheck(state: CraftingState): { roll: number; pointsAdded: number } {
const roll = rollD10();
const pointsAdded = roll + state.craftingSkill + state.expertise;
return { roll, pointsAdded };
}

/**
 * Logs a message to the crafting log.
 */
function logMessage(state: CraftingState, message: string): CraftingState {
return { ...state, log: [...state.log, message] };
}

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
dice_cost: 0, // Rules state 'X Crafting Points' for Weapon Alloy, implying only point cost. Readme example also has 0 dice cost.
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
effect: '+2 Electrum Power bonus against Divines, Summons or Otherworlders.'
},
feathersteel: { point_cost: 15, dice_cost: 0, effect: 'Incurs 1 less burden (min 0.5).' },
mycelite: { point_cost: 20, dice_cost: 0, effect: 'Incurs 1.5 less burden (min 0.5).' },
titanium: { point_cost: 0, dice_cost: 0, effect: 'Gain +30 Crafting Points.' }, // Special case handled in Weapon Alloy
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
luxaeterna: { point_cost: 15, dice_cost: 0, effect: 'Changes physical damage to Holy.' },
corvuskite: { point_cost: 15, dice_cost: 0, effect: 'Changes physical damage to Dark.' },
arcanium: { point_cost: 15, dice_cost: 0, effect: 'Changes physical damage to Arcane.' },
vivinthal: { point_cost: 15, dice_cost: 0, effect: 'Changes physical damage to Water.' },
salachar: { point_cost: 15, dice_cost: 0, effect: 'Changes physical damage to Fire.' },
sylphsteel: { point_cost: 15, dice_cost: 0, effect: 'Changes physical damage to Wind.' },
ghimslag: { point_cost: 15, dice_cost: 0, effect: 'Changes physical damage to Earth.' }
};

// --- Crafting Actions ---

export const craftingActions: CraftingActions = {
'basic-craft': {
id: 'basic-craft',
name: 'Basic Craft',
costText: '1 Crafting Die',
className: null,
classLevel: 0,
diceCost: 1,
pointsCost: 0,
isRapid: true,
requiresPrerequisite: false,
description: 'Perform a standard crafting check (1d10 + Skill + Expertise).',
effect: (state) => {
const { roll, pointsAdded } = performCraftingCheck(state);
let newState = {
...state,
diceRemaining: state.diceRemaining - 1,
craftingPoints: state.craftingPoints + pointsAdded
};
newState = logMessage(
newState,
`Used Basic Craft. Rolled ${roll}. Added ${pointsAdded} points (${state.craftingPoints} -> ${newState.craftingPoints}). ${newState.diceRemaining} dice left.`
);
return newState;
}
},
'beginners-luck': {
id: 'beginners-luck',
name: "Beginner's Luck",
costText: '1 Crafting Die',
className: null,
classLevel: 0,
diceCost: 1,
pointsCost: 0,
isRapid: false,
requiresPrerequisite: false,
description:
'Roll 2d10, pick highest. Add result + Expertise (NO Skill) to points.',
effect: (state) => {
const roll1 = rollD10();
const roll2 = rollD10();
const highestRoll = Math.max(roll1, roll2);
const pointsAdded = highestRoll + state.expertise; // No crafting skill
let newState = {
...state,
diceRemaining: state.diceRemaining - 1,
craftingPoints: state.craftingPoints + pointsAdded,
usedActions: [...state.usedActions, 'beginners-luck']
};
newState = logMessage(
newState,
`Used Beginner's Luck. Rolled ${roll1}, ${roll2} (took ${highestRoll}). Added ${pointsAdded} points (${state.craftingPoints} -> ${newState.craftingPoints}). ${newState.diceRemaining} dice left.`
);
return newState;
}
},
'standard-finish': {
id: 'standard-finish',
name: 'Standard Finish',
costText: '2 Crafting Dice',
className: null,
classLevel: 0,
diceCost: 2,
pointsCost: 0,
isRapid: false,
requiresPrerequisite: true,
prerequisite: (state) => state.bonuses.length === 0 && state.alloys.length === 0, // Cannot be used if modified
description:
'Double current crafting points and END crafting. Cannot be used if item has bonuses or alloys.',
effect: (state) => {
const doubledPoints = state.craftingPoints * 2;
let newState = {
...state,
diceRemaining: 0, // Ends crafting
craftingPoints: doubledPoints,
usedActions: [...state.usedActions, 'standard-finish']
};
newState = logMessage(
newState,
`Used Standard Finish. Doubled points (${state.craftingPoints} -> ${doubledPoints}). Crafting ended.`
);
// Note: Actual finish logic (checking HP) happens outside the action effect
return newState;
}
},
'steady-craft': {
id: 'steady-craft',
name: 'Steady Craft',
costText: '1 Crafting Die',
className: null,
classLevel: 0,
diceCost: 1,
pointsCost: 0,
isRapid: false, // Mutually exclusive with Steady Craft II
requiresPrerequisite: true,
prerequisite: (state) => !state.usedActions.includes('steady-craft-2'),
description: 'Perform a crafting check (Skill + Expertise), d10 result is automatically 5.',
effect: (state) => {
const roll = 5;
const pointsAdded = roll + state.craftingSkill + state.expertise;
let newState = {
...state,
diceRemaining: state.diceRemaining - 1,
craftingPoints: state.craftingPoints + pointsAdded,
usedActions: [...state.usedActions, 'steady-craft']
};
newState = logMessage(
newState,
`Used Steady Craft. Roll is 5. Added ${pointsAdded} points (${state.craftingPoints} -> ${newState.craftingPoints}). ${newState.diceRemaining} dice left.`
);
return newState;
}
},
// --- Blacksmith Actions ---
'blacksmiths-design': {
id: 'blacksmiths-design',
name: "Blacksmith's Design",
costText: '15 Crafting Points',
className: 'blacksmith',
classLevel: 1,
diceCost: 0,
pointsCost: 15,
isRapid: false,
requiresPrerequisite: false, // TODO: Add check if item is a smithing tool? For now, assume yes.
description: 'If crafting a smithing tool, it gains a +1 Crafting Artisan Bonus.',
effect: (state) => {
let newState = {
...state,
craftingPoints: state.craftingPoints - 15,
bonuses: [...state.bonuses, '+1 Crafting'],
usedActions: [...state.usedActions, 'blacksmiths-design']
};
newState = logMessage(
newState,
`Used Blacksmith's Design. Cost 15 points (${state.craftingPoints} -> ${newState.craftingPoints}). Added +1 Crafting bonus.`
);
return newState;
}
},
'sharpening-reinforcing': {
id: 'sharpening-reinforcing',
name: 'Sharpening & Reinforcing',
costText: '15 Crafting Points',
className: 'blacksmith',
classLevel: 1,
diceCost: 0,
pointsCost: 15,
isRapid: false,
requiresPrerequisite: false, // TODO: Add check if item is a weapon? For now, assume yes.
description: 'If crafting a weapon, it gains a +1 Power Artisan Bonus.',
effect: (state) => {
let newState = {
...state,
craftingPoints: state.craftingPoints - 15,
bonuses: [...state.bonuses, '+1 Power'],
usedActions: [...state.usedActions, 'sharpening-reinforcing']
};
newState = logMessage(
newState,
`Used Sharpening & Reinforcing. Cost 15 points (${state.craftingPoints} -> ${newState.craftingPoints}). Added +1 Power bonus.`
);
return newState;
}
},
'weight-balancing': {
id: 'weight-balancing',
name: 'Weight Balancing',
costText: '15 Crafting Points',
className: 'blacksmith',
classLevel: 1,
diceCost: 0,
pointsCost: 15,
isRapid: false,
requiresPrerequisite: false, // TODO: Add check if item is a weapon? For now, assume yes.
description: 'If crafting a weapon, it gains a +1 Focus Artisan Bonus.',
effect: (state) => {
let newState = {
...state,
craftingPoints: state.craftingPoints - 15,
bonuses: [...state.bonuses, '+1 Focus'],
usedActions: [...state.usedActions, 'weight-balancing']
};
newState = logMessage(
newState,
`Used Weight Balancing. Cost 15 points (${state.craftingPoints} -> ${newState.craftingPoints}). Added +1 Focus bonus.`
);
return newState;
}
},
'weapon-alloy': {
id: 'weapon-alloy',
name: 'Weapon Alloy',
costText: 'X Crafting Points', // Cost depends on selected alloy
className: 'blacksmith',
classLevel: 1,
diceCost: 0, // See note on specialMaterials
pointsCost: 0, // Determined dynamically
isRapid: false, // Can only add one alloy type per craft? Rules imply this. Let's assume one alloy action total.
requiresPrerequisite: false, // TODO: Add check if item is a weapon? For now, assume yes.
description: 'Mix a special material into the weapon, costing Crafting Points.',
// Effect is handled specially in the component due to dropdown selection
effect: (state, alloyId?: string, alloyData?: SpecialMaterial) => {
if (!alloyId || !alloyData) {
return logMessage(state, 'Error: No alloy selected for Weapon Alloy.');
}
if (state.alloys.includes(alloyId)) {
return logMessage(state, `Error: Alloy ${alloyId} already added.`);
}

let pointsCost = alloyData.point_cost;
let pointsGain = 0;
let logMsg = `Used Weapon Alloy (${alloyId}). `;

if (alloyId === 'titanium') {
pointsGain = 30;
logMsg += `Gained ${pointsGain} points. `;
} else {
logMsg += `Cost ${pointsCost} points (${state.craftingPoints} -> ${state.craftingPoints - pointsCost + pointsGain}). `;
}

let newState = {
...state,
craftingPoints: state.craftingPoints - pointsCost + pointsGain,
alloys: [...state.alloys, alloyId],
usedActions: [...state.usedActions, 'weapon-alloy'] // Mark base action as used
};

newState = logMessage(newState, logMsg + `Added ${alloyId} effect.`);
return newState;
}
} as CraftingAction, // Cast because effect has extra params
'steady-craft-2': {
id: 'steady-craft-2',
name: 'Steady Craft II',
costText: '1 Crafting Die',
className: 'blacksmith',
classLevel: 6,
diceCost: 1,
pointsCost: 0,
isRapid: false, // Mutually exclusive with Steady Craft I
requiresPrerequisite: true,
prerequisite: (state) => !state.usedActions.includes('steady-craft'),
description: 'Perform a crafting check (Skill + Expertise), d10 result is automatically 7.',
effect: (state) => {
const roll = 7;
const pointsAdded = roll + state.craftingSkill + state.expertise;
let newState = {
...state,
diceRemaining: state.diceRemaining - 1,
craftingPoints: state.craftingPoints + pointsAdded,
usedActions: [...state.usedActions, 'steady-craft-2']
};
newState = logMessage(
newState,
`Used Steady Craft II. Roll is 7. Added ${pointsAdded} points (${state.craftingPoints} -> ${newState.craftingPoints}). ${newState.diceRemaining} dice left.`
);
return newState;
}
},
// --- Forgemaster Actions ---
'blacksmiths-ergonomics': {
id: 'blacksmiths-ergonomics',
name: "Blacksmith's Ergonomics",
costText: '30 Crafting Points',
className: 'forgemaster',
classLevel: 1,
diceCost: 0,
pointsCost: 30,
isRapid: false,
requiresPrerequisite: true,
prerequisite: (state) => state.bonuses.includes('+1 Crafting'),
description: 'Upgrades a +1 Crafting Artisan Bonus to +2.',
effect: (state) => {
const bonusIndex = state.bonuses.indexOf('+1 Crafting');
const newBonuses = [...state.bonuses];
if (bonusIndex > -1) {
newBonuses.splice(bonusIndex, 1, '+2 Crafting');
}
let newState = {
...state,
craftingPoints: state.craftingPoints - 30,
bonuses: newBonuses,
usedActions: [...state.usedActions, 'blacksmiths-ergonomics']
};
newState = logMessage(
newState,
`Used Blacksmith's Ergonomics. Cost 30 points (${state.craftingPoints} -> ${newState.craftingPoints}). Upgraded +1 Crafting to +2.`
);
return newState;
}
},
tempering: {
id: 'tempering',
name: 'Tempering',
costText: '30 Crafting Points',
className: 'forgemaster',
classLevel: 1,
diceCost: 0,
pointsCost: 30,
isRapid: false,
requiresPrerequisite: true,
prerequisite: (state) => state.bonuses.includes('+1 Power'),
description: 'Upgrades a +1 Power Artisan Bonus to +2.',
effect: (state) => {
const bonusIndex = state.bonuses.indexOf('+1 Power');
const newBonuses = [...state.bonuses];
if (bonusIndex > -1) {
newBonuses.splice(bonusIndex, 1, '+2 Power');
}
let newState = {
...state,
craftingPoints: state.craftingPoints - 30,
bonuses: newBonuses,
usedActions: [...state.usedActions, 'tempering']
};
newState = logMessage(
newState,
`Used Tempering. Cost 30 points (${state.craftingPoints} -> ${newState.craftingPoints}). Upgraded +1 Power to +2.`
);
return newState;
}
},
'grip-ergonomics': {
id: 'grip-ergonomics',
name: 'Grip Ergonomics',
costText: '30 Crafting Points',
className: 'forgemaster',
classLevel: 1,
diceCost: 0,
pointsCost: 30,
isRapid: false,
requiresPrerequisite: true,
prerequisite: (state) => state.bonuses.includes('+1 Focus'),
description: 'Upgrades a +1 Focus Artisan Bonus to +2.',
effect: (state) => {
const bonusIndex = state.bonuses.indexOf('+1 Focus');
const newBonuses = [...state.bonuses];
if (bonusIndex > -1) {
newBonuses.splice(bonusIndex, 1, '+2 Focus');
}
let newState = {
...state,
craftingPoints: state.craftingPoints - 30,
bonuses: newBonuses,
usedActions: [...state.usedActions, 'grip-ergonomics']
};
newState = logMessage(
newState,
`Used Grip Ergonomics. Cost 30 points (${state.craftingPoints} -> ${newState.craftingPoints}). Upgraded +1 Focus to +2.`
);
return newState;
}
},
'inspired-finish': {
id: 'inspired-finish',
name: 'Inspired Finish',
costText: '1 Crafting Die (Last)',
className: 'forgemaster',
classLevel: 2,
diceCost: 1,
pointsCost: 0,
isRapid: false,
requiresPrerequisite: true,
prerequisite: (state) => state.diceRemaining === 1,
description:
'Must be your last die. Make a crafting check (Skill + Expertise), rolling 3d10 instead of 1d10. Ends crafting.',
effect: (state) => {
const roll1 = rollD10();
const roll2 = rollD10();
const roll3 = rollD10();
const totalRoll = roll1 + roll2 + roll3;
const pointsAdded = totalRoll + state.craftingSkill + state.expertise;
let newState = {
...state,
diceRemaining: 0, // Uses last die and ends crafting
craftingPoints: state.craftingPoints + pointsAdded,
usedActions: [...state.usedActions, 'inspired-finish']
};
newState = logMessage(
newState,
`Used Inspired Finish. Rolled ${roll1}+${roll2}+${roll3}=${totalRoll}. Added ${pointsAdded} points (${state.craftingPoints} -> ${newState.craftingPoints}). Crafting ended.`
);
// Note: Actual finish logic (checking HP) happens outside the action effect
return newState;
}
}
};

// --- Initial State ---

export const initialCraftingState: CraftingState = {
itemValue: 500,
craftingHP: 50,
baseMaterial: 'iron',
craftingSkill: 5,
expertise: 10,
blacksmithLevel: 1,
forgemasterLevel: 0,
diceRemaining: 5, // Base 5 + material bonus (calculated on init)
craftingPoints: 0,
usedActions: [],
bonuses: [],
materials: [], // Calculated on init
alloys: [],
log: ['Crafting simulator initialized.'],
initialDice: 5 // Base 5 + material bonus (calculated on init)
};
