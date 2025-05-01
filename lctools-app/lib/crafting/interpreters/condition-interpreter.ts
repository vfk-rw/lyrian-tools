/**
 * Interpreter for action conditions to convert declarative conditions into executable functions
 */

import type { CraftingState } from '../types';
import type {
  Condition,
  PropertyCondition,
  ContainsCondition,
  NotContainsCondition,
  ClassLevelCondition,
  ActionUsedCondition,
  DiceRemainingCondition,
  CustomCondition
} from '../schemas/action-schema';

/**
 * Evaluate a single condition against the current state
 */
export function evaluateCondition(
  condition: Condition,
  state: CraftingState
): boolean {
  switch (condition.type) {
    case 'check_property':
      return evaluatePropertyCondition(condition as PropertyCondition, state);
    case 'check_contains':
      return evaluateContainsCondition(condition as ContainsCondition, state);
    case 'check_not_contains':
      return evaluateNotContainsCondition(condition as NotContainsCondition, state);
    case 'check_class_level':
      return evaluateClassLevelCondition(condition as ClassLevelCondition, state);
    case 'check_action_used':
      return evaluateActionUsedCondition(condition as ActionUsedCondition, state);
    case 'check_dice_remaining':
      return evaluateDiceRemainingCondition(condition as DiceRemainingCondition, state);
    case 'check_custom':
      return evaluateCustomCondition(condition as CustomCondition, state);
    default:
      console.warn(`Unknown condition type: ${(condition as Condition).type}`);
      return false;
  }
}

/**
 * Evaluate all conditions in the array (if any), returning true only if all are true
 */
export function evaluateConditions(
  conditions: Condition[] | undefined,
  state: CraftingState
): boolean {
  // If no conditions are specified, return true
  if (!conditions || conditions.length === 0) {
    return true;
  }
  
  // Check all conditions
  for (const condition of conditions) {
    if (!evaluateCondition(condition, state)) {
      return false;
    }
  }
  
  return true;
}

// --- Individual condition evaluators ---

function evaluatePropertyCondition(
  condition: PropertyCondition,
  state: CraftingState
): boolean {
  const property = condition.property as keyof CraftingState;
  
  // Get the property value
  if (!(property in state)) {
    console.warn(`Property not found in state: ${String(property)}`);
    return false;
  }
  
  const value = state[property];
  
  // Compare using the specified operation
  switch (condition.operation) {
    case 'equals':
      return value === condition.value;
    case 'not_equals':
      return value !== condition.value;
    case 'greater_than':
      return value > condition.value;
    case 'less_than':
      return value < condition.value;
    case 'greater_than_or_equal':
      return value >= condition.value;
    case 'less_than_or_equal':
      return value <= condition.value;
    default:
      console.warn(`Unknown comparison operation: ${condition.operation}`);
      return false;
  }
}

function evaluateContainsCondition(
  condition: ContainsCondition,
  state: CraftingState
): boolean {
  const arrayProperty = condition.array as keyof CraftingState;
  
  // Get the array value
  if (!(arrayProperty in state)) {
    console.warn(`Array property not found in state: ${String(arrayProperty)}`);
    return false;
  }
  
  const array = state[arrayProperty];
  
  // Ensure it's an array
  if (!Array.isArray(array)) {
    console.warn(`Property is not an array: ${String(arrayProperty)}`);
    return false;
  }
  
  // Check if the array contains the value
  return array.includes(condition.value);
}

function evaluateNotContainsCondition(
  condition: NotContainsCondition,
  state: CraftingState
): boolean {
  const arrayProperty = condition.array as keyof CraftingState;
  
  // Get the array value
  if (!(arrayProperty in state)) {
    console.warn(`Array property not found in state: ${String(arrayProperty)}`);
    return false;
  }
  
  const array = state[arrayProperty];
  
  // Ensure it's an array
  if (!Array.isArray(array)) {
    console.warn(`Property is not an array: ${String(arrayProperty)}`);
    return false;
  }
  
  // Check if the array does not contain the value
  return !array.includes(condition.value);
}

function evaluateClassLevelCondition(
  condition: ClassLevelCondition,
  state: CraftingState
): boolean {
  const className = condition.class;
  const minLevel = condition.min_level;
  
  // Check the appropriate class level
  if (className === 'blacksmith') {
    return state.blacksmithLevel >= minLevel;
  } else if (className === 'forgemaster') {
    return state.forgemasterLevel >= minLevel;
  }
  
  return false;
}

function evaluateActionUsedCondition(
  condition: ActionUsedCondition,
  state: CraftingState
): boolean {
  const actionId = condition.action_id;
  const used = condition.used;
  
  // Check if the action has been used
  const actionUsed = state.usedActions.includes(actionId);
  
  // Return true if the action usage matches what we're checking for
  return actionUsed === used;
}

function evaluateDiceRemainingCondition(
  condition: DiceRemainingCondition,
  state: CraftingState
): boolean {
  const diceRemaining = state.diceRemaining;
  
  // Compare using the specified operation
  switch (condition.operation) {
    case 'equals':
      return diceRemaining === condition.value;
    case 'not_equals':
      return diceRemaining !== condition.value;
    case 'greater_than':
      return diceRemaining > condition.value;
    case 'less_than':
      return diceRemaining < condition.value;
    case 'greater_than_or_equal':
      return diceRemaining >= condition.value;
    case 'less_than_or_equal':
      return diceRemaining <= condition.value;
    default:
      console.warn(`Unknown comparison operation: ${condition.operation}`);
      return false;
  }
}

function evaluateCustomCondition(
  condition: CustomCondition,
  state: CraftingState
): boolean {
  // Handle special custom checks
  switch (condition.check) {
    case 'standard_finish_eligibility':
      // Standard Finish can only be used if the item has no bonuses or alloys
      return state.bonuses.length === 0 && state.alloys.length === 0;
    case 'weapon_alloy_eligibility':
      // Only one alloy allowed per weapon
      return state.alloys.length === 0;
    // Add other custom checks as needed
    default:
      console.warn(`Unknown custom check: ${condition.check}`);
      return false;
  }
}
