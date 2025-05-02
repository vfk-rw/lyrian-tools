export interface CraftingState {
	itemValue: number;
	craftingHP: number;
	baseMaterial: string;
	craftingSkill: number;
	expertise: number;
	blacksmithLevel: number;
	forgemasterLevel: number;
	// Alchemy-specific properties
	alchemistLevel: number;  
	alchemeisterLevel: number;
	itemType: string;  // 'potion', 'elixir', 'salve', 'flask'
	isHealing: boolean;
	isDamaging: boolean;
	isAOE: boolean;
	// Common properties
	diceRemaining: number;
	craftingPoints: number;
	usedActions: string[];
	bonuses: string[]; // e.g., '+1 Power', '+2 Focus', 'Cold Iron'
	materials: { name: string; units: number }[];
	alloys: string[]; // Names of special materials added
	log: string[];
	initialDice: number; // Store the starting dice count
}

// Add alchemy item types
export type AlchemyItemType = 'potion' | 'elixir' | 'salve' | 'flask';

export interface MaterialBonusDice {
	[key: string]: number;
}

export interface SpecialMaterial {
    name: string;
	point_cost: number;
	dice_cost: number; // Note: readme says 0, rules have costs for some? Sticking to rules for now.
	effect: string;
	special_effect?: string; // Added to support special effects like titanium_points
}

export interface SpecialMaterials {
	[key: string]: SpecialMaterial;
}

export interface CraftingAction {
	id: string;
	name: string; // Added for display purposes
	costText: string; // Added for display purposes
	className: 'blacksmith' | 'forgemaster' | 'alchemist' | 'alchemeister' | null;
	classLevel: number;
	diceCost: number;
	pointsCost: number;
	isRapid: boolean;
	requiresPrerequisite: boolean;
	prerequisite?: (state: CraftingState) => boolean;
	// effect applies state transformation, with optional additional crafting data (e.g., selected alloy id)
	effect: (state: CraftingState, additionalData?: unknown) => CraftingState;
	description: string; // Added for tooltips/info
}

export interface CraftingActions {
	[key: string]: CraftingAction;
}

export interface BaseMaterial {
    name: string;
    effectText: string;
    bonusDice: number;
}
