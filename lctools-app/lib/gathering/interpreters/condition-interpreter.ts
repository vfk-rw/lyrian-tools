/**
 * Interpreter for evaluating conditions to determine action eligibility
 */

import type { GatheringState } from '../types';
import type {
  Condition,
  HasEnoughDiceCondition,
  HasEnoughNPCondition,
  HasEnoughLPCondition,
  HasUsedActionCondition,
  HasNotUsedActionCondition,
  HasSkillLevelCondition,
  NodeHasVariationCondition
} from '../schemas/action-schema';

/**
 * Evaluate a single condition
 */
export function evaluateCondition(
  condition: Condition,
  state: GatheringState
): boolean {
  switch (condition.type) {
    case 'has_enough_dice':
      return evaluateHasEnoughDiceCondition(condition as HasEnoughDiceCondition, state);
    case 'has_enough_np':
      return evaluateHasEnoughNPCondition(condition as HasEnoughNPCondition, state);
    case 'has_enough_lp':
      return evaluateHasEnoughLPCondition(condition as HasEnoughLPCondition, state);
    case 'has_used_action':
      return evaluateHasUsedActionCondition(condition as HasUsedActionCondition, state);
    case 'has_not_used_action':
      return evaluateHasNotUsedActionCondition(condition as HasNotUsedActionCondition, state);
    case 'has_skill_level':
      return evaluateHasSkillLevelCondition(condition as HasSkillLevelCondition, state);
    case 'node_has_variation':
      return evaluateNodeHasVariationCondition(condition as NodeHasVariationCondition, state);
    default:
      console.warn(`Unknown condition type: ${condition.type}`);
      return false;
  }
}

/**
 * Evaluate all conditions (AND logic)
 */
export function evaluateConditions(
  conditions: Condition[],
  state: GatheringState
): boolean {
  if (!conditions || conditions.length === 0) {
    return true;
  }
  
  // All conditions must evaluate to true
  return conditions.every(condition => evaluateCondition(condition, state));
}

// --- Individual condition evaluators ---

function evaluateHasEnoughDiceCondition(
  condition: HasEnoughDiceCondition,
  state: GatheringState
): boolean {
  return state.diceRemaining >= condition.amount;
}

function evaluateHasEnoughNPCondition(
  condition: HasEnoughNPCondition,
  state: GatheringState
): boolean {
  return state.currentNP >= condition.amount;
}

function evaluateHasEnoughLPCondition(
  condition: HasEnoughLPCondition,
  state: GatheringState
): boolean {
  return state.currentLP >= condition.amount;
}

function evaluateHasUsedActionCondition(
  condition: HasUsedActionCondition,
  state: GatheringState
): boolean {
  return state.usedActions.includes(condition.action_id);
}

function evaluateHasNotUsedActionCondition(
  condition: HasNotUsedActionCondition,
  state: GatheringState
): boolean {
  return !state.usedActions.includes(condition.action_id);
}

function evaluateHasSkillLevelCondition(
  condition: HasSkillLevelCondition,
  state: GatheringState
): boolean {
  // Note: This is a placeholder implementation since we don't have a skills system yet
  // In a real implementation, this would check the character's skill levels
  
  // For now, we just check if the gathering skill meets the requirement
  if (condition.skill === 'gathering') {
    return state.gatheringSkill >= condition.level;
  }
  
  return false;
}

function evaluateNodeHasVariationCondition(
  condition: NodeHasVariationCondition,
  state: GatheringState
): boolean {
  return state.variations.includes(condition.variation);
}