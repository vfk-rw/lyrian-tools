/**
 * Schema definitions for crafting actions in declarative format
 */

import type { CraftingState } from '../types';

// Define effect types
export type EffectType = 
  | 'modify' 
  | 'roll' 
  | 'calculate' 
  | 'log' 
  | 'end_crafting'
  | 'add_bonus'
  | 'add_alloy'
  | 'upgrade_bonus';

// Define condition types  
export type ConditionType =
  | 'check_property'
  | 'check_contains'
  | 'check_not_contains'
  | 'check_class_level'
  | 'check_action_used'
  | 'check_dice_remaining'
  | 'check_custom';

// Define operation types
export type ComparisonOperation =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal';

// Base interfaces
export interface Effect {
  type: EffectType;
  [key: string]: string | number | boolean | object | unknown; // Additional properties based on effect type
}

export interface Condition {
  type: ConditionType;
  [key: string]: string | number | boolean | object | unknown; // Additional properties based on condition type
}

// Specific effect types
export interface ModifyEffect extends Effect {
  type: 'modify';
  target: keyof CraftingState | string; // Property to modify
  operation: 'add' | 'subtract' | 'set' | 'multiply' | 'divide';
  value: number | string; // Can be a literal number or a reference to a variable
}

export interface RollEffect extends Effect {
  type: 'roll';
  dice: {
    sides: number;
    count: number;
  };
  store_as: string; // Variable name to store result
}

export interface CalculateEffect extends Effect {
  type: 'calculate';
  formula: string; // e.g., "{roll} + craftingSkill + expertise"
  store_as: string; // Variable name to store result
}

export interface LogEffect extends Effect {
  type: 'log';
  message: string; // Can contain variable references like {rollResult}
}

export interface EndCraftingEffect extends Effect {
  type: 'end_crafting';
}

export interface AddBonusEffect extends Effect {
  type: 'add_bonus';
  bonus: string; // e.g., '+1 Crafting'
}

export interface AddAlloyEffect extends Effect {
  type: 'add_alloy';
  alloy: string | '{selected_alloy}'; // Can be hardcoded or reference selected alloy
}

export interface UpgradeBonusEffect extends Effect {
  type: 'upgrade_bonus';
  from: string; // e.g., '+1 Crafting'
  to: string; // e.g., '+2 Crafting'
}

// Specific condition types
export interface PropertyCondition extends Condition {
  type: 'check_property';
  property: keyof CraftingState | string;
  operation: ComparisonOperation;
  value: string | number | boolean;
}

export interface ContainsCondition extends Condition {
  type: 'check_contains';
  array: keyof CraftingState | string; // Should reference an array property
  value: string | number;
}

export interface NotContainsCondition extends Condition {
  type: 'check_not_contains';
  array: keyof CraftingState | string; // Should reference an array property
  value: string | number;
}

export interface ClassLevelCondition extends Condition {
  type: 'check_class_level';
  class: 'blacksmith' | 'forgemaster';
  min_level: number;
}

export interface ActionUsedCondition extends Condition {
  type: 'check_action_used';
  action_id: string;
  used: boolean;
}

export interface DiceRemainingCondition extends Condition {
  type: 'check_dice_remaining';
  operation: ComparisonOperation;
  value: number;
}

export interface CustomCondition extends Condition {
  type: 'check_custom';
  check: string; // A custom check identifier that will be handled specially
}

// Define the declarative action schema
export interface DeclarativeAction {
  id: string;
  name: string;
  cost_text: string;
  class_name: 'blacksmith' | 'forgemaster' | null;
  class_level: number;
  dice_cost: number;
  points_cost: number;
  is_rapid: boolean;
  requires_prerequisite: boolean;
  description: string;
  effects: Effect[];
  conditions?: Condition[];
}
