/**
 * Schema definitions for declarative gathering actions
 */

// Base effect interface
export interface Effect {
  type: string;
}

// Base condition interface
export interface Condition {
  type: string;
}

/**
 * Declarative definition of a gathering action
 */
export interface DeclarativeGatheringAction {
  id: string;
  name: string;
  cost_text: string;
  dice_cost: number;
  node_points_cost: number;
  lucky_points_cost: number;
  is_rapid: boolean;
  requires_prerequisite: boolean;
  description: string;
  effects: Effect[];
  conditions?: Condition[];
  
  // Custom code for branching logic
  effect_code?: string;
  // Class-specific metadata
  class?: string;
  level?: number;

  // Optional properties
  class_name?: string;
  class_level?: number;
}

// Effect Types

export interface ModifyEffect extends Effect {
  type: 'modify';
  target: string; // Property name to modify
  operation: 'add' | 'subtract' | 'multiply' | 'divide' | 'set';
  value: number | string; // Can be a literal value or a variable reference like "{roll}"
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
  formula: string; // e.g., "{roll} + gatheringSkill + expertise"
  store_as: string; // Variable name to store result
}

export interface LogEffect extends Effect {
  type: 'log';
  message: string; // Can contain variable references like {rollResult}
}

export interface EndGatheringEffect extends Effect {
  type: 'end_gathering';
}

export interface DistributePointsEffect extends Effect {
  type: 'distribute_points';
  total_points: number | string; // Can be a literal value or a variable reference
  np_points: number | string; // Can be a number, percentage, or formula
  lp_points: number | string; // Can be a number, percentage, or formula
}

export interface ConvertPointsEffect extends Effect {
  type: 'convert_points';
  from: 'lp' | 'np';
  to: 'np' | 'lp';
  amount: number | string; // Can be a literal value, variable reference, or 'all'
  max?: number; // Optional maximum amount to convert
}

// Condition Types

export interface HasEnoughDiceCondition extends Condition {
  type: 'has_enough_dice';
  amount: number;
}

export interface HasEnoughNPCondition extends Condition {
  type: 'has_enough_np';
  amount: number;
}

export interface HasEnoughLPCondition extends Condition {
  type: 'has_enough_lp';
  amount: number;
}

export interface HasUsedActionCondition extends Condition {
  type: 'has_used_action';
  action_id: string;
}

export interface HasNotUsedActionCondition extends Condition {
  type: 'has_not_used_action';
  action_id: string;
}

export interface HasSkillLevelCondition extends Condition {
  type: 'has_skill_level';
  skill: string;
  level: number;
}

export interface NodeHasVariationCondition extends Condition {
  type: 'node_has_variation';
  variation: string;
}