/**
 * Core types for the gathering system
 */

/**
 * Represents a resource node that can be gathered from
 */
export interface ResourceNode {
  name: string;
  type: string; // ore, herb, etc.
  hp: number;
  nodePoints: number;
  luckyPoints: number;
  yield: number;
  yieldType: string;
  luckyYield: number;
  luckyYieldType: string;
  variations: string[]; // IDs of variations that apply to this node
}

/**
 * Represents a variation of a resource node
 */
export interface NodeVariation {
  id: string;
  name: string;
  description: string;
  applyEffect: (state: GatheringState) => GatheringState;
}

/**
 * The state of a gathering session
 */
export interface GatheringState {
  // Node properties
  nodeHP: number;
  nodePoints: number;
  luckyPoints: number;
  nodeType: string;
  
  // Current gathering progress
  currentNP: number;
  currentLP: number;
  diceRemaining: number;
  
  // Gatherer properties
  gatheringSkill: number;
  expertise: number;
  toolBonus: number;
  
  // Session tracking
  usedActions: string[];
  variations: string[];
  bonuses: string[];
  log: string[];
  
  // Result tracking
  success: boolean;
  luckySuccess: boolean;
  normalYield: number;
  luckyYield: number;
  yieldType: string;
  luckyYieldType: string;
}

/**
 * A function that executes a gathering action
 */
export type GatheringActionFunction = (state: GatheringState, additionalData?: unknown) => GatheringState;

/**
 * A function that determines if an action is eligible to be used
 */
export type GatheringPrerequisiteFunction = (state: GatheringState) => boolean;

/**
 * An executable gathering action
 */
export interface GatheringAction {
  id: string;
  name: string;
  costText: string;
  diceCost: number;
  nodePointsCost: number;
  luckyPointsCost: number;
  isRapid: boolean;
  requiresPrerequisite: boolean;
  description: string;
  
  // Optional properties
  className?: string;
  classLevel?: number;
  
  // Functions
  prerequisite?: GatheringPrerequisiteFunction;
  effect: GatheringActionFunction;
}

/**
 * Dictionary of all available gathering actions
 */
export interface GatheringActions {
  [key: string]: GatheringAction;
}

/**
 * Dictionary of all available node variations
 */
export interface NodeVariations {
  [key: string]: NodeVariation;
}