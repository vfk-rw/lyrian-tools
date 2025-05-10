/**
 * Utility functions for the gathering system
 */

import type { GatheringState } from './types';

/**
 * Roll a d10
 */
export function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

/**
 * Roll a d20
 */
export function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

/**
 * Roll a die with any number of sides
 */
export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Apply node variation modifiers to the gathering state
 */
export function applyVariationModifiers(state: GatheringState): GatheringState {
  // This is a placeholder. The actual implementation will use the node variations
  // defined in the system to modify the state.
  return state;
}

/**
 * Calculate the gathering check result
 * @param roll The d10 roll result
 * @param state The current gathering state
 * @returns The total result of the gathering check
 */
export function calculateGatheringCheck(roll: number, state: GatheringState): number {
  let total = roll;
  
  // Add gathering skill
  total += state.gatheringSkill;
  
  // Add expertise
  total += state.expertise;
  
  // Add tool bonus
  total += state.toolBonus;
  
  // Add any other bonuses from the state
  // This is just an example - implement according to your game rules
  const ironFocusBonus = state.bonuses.includes('Iron Focus') ? 5 : 0;
  total += ironFocusBonus;
  
  // Return the total
  return total;
}

/**
 * Distribute points between NP and LP
 * @param total Total points to distribute
 * @param npAmount Amount or percentage to allocate to NP
 * @param lpAmount Amount or percentage to allocate to LP
 * @returns Object containing the NP and LP distribution
 */
export function distributePoints(
  total: number, 
  npAmount: number | string, 
  lpAmount: number | string
): { np: number; lp: number } {
  // If both are numbers, use them directly
  if (typeof npAmount === 'number' && typeof lpAmount === 'number') {
    // Ensure we don't exceed the total
    const sum = npAmount + lpAmount;
    if (sum > total) {
      const ratio = total / sum;
      return {
        np: Math.floor(npAmount * ratio),
        lp: Math.floor(lpAmount * ratio)
      };
    }
    return { np: npAmount, lp: lpAmount };
  }
  
  // Handle percentages
  if (typeof npAmount === 'string' && npAmount.endsWith('%')) {
    const npPercent = parseFloat(npAmount) / 100;
    const np = Math.floor(total * npPercent);
    const lp = total - np;
    return { np, lp };
  }
  
  if (typeof lpAmount === 'string' && lpAmount.endsWith('%')) {
    const lpPercent = parseFloat(lpAmount) / 100;
    const lp = Math.floor(total * lpPercent);
    const np = total - lp;
    return { np, lp };
  }
  
  // Default equal distribution
  const half = Math.floor(total / 2);
  return { np: half, lp: total - half };
}

/**
 * Add points to the gathering state
 * @param state Current gathering state
 * @param npPoints Points to add to NP
 * @param lpPoints Points to add to LP
 * @returns Updated gathering state
 */
export function addGatheringPoints(
  state: GatheringState,
  npPoints: number,
  lpPoints: number
): GatheringState {
  const newState = { ...state };
  
  // Add NP points
  newState.currentNP += npPoints;
  
  // Add LP points
  newState.currentLP += lpPoints;
  
  return newState;
}

/**
 * Check if an action can be used
 * @param state Current gathering state
 * @param actionId ID of the action
 * @param diceCost Dice cost of the action
 * @param npCost NP cost of the action
 * @param lpCost LP cost of the action
 * @param isRapid Whether the action can be used multiple times
 * @returns True if the action can be used, false otherwise
 */
export function canUseAction(
  state: GatheringState,
  actionId: string,
  diceCost: number,
  npCost: number,
  lpCost: number,
  isRapid: boolean
): boolean {
  // Check if gathering is already complete
  if (state.diceRemaining <= 0) {
    return false;
  }
  
  // Check if we have enough dice
  if (state.diceRemaining < diceCost) {
    return false;
  }
  
  // Check if we have enough NP
  if (state.currentNP < npCost) {
    return false;
  }
  
  // Check if we have enough LP
  if (state.currentLP < lpCost) {
    return false;
  }
  
  // Block reuse only for Novice's Perseverance
  if (!isRapid && actionId === 'novices-perseverance' && state.usedActions.includes(actionId)) {
    return false;
  }
  
  return true;
}

/**
 * Execute a gathering action with costs
 * @param state Current gathering state
 * @param actionId ID of the action
 * @param diceCost Dice cost of the action
 * @param npCost NP cost of the action
 * @param lpCost LP cost of the action
 * @returns Updated gathering state with costs applied
 */
export function executeGatheringAction(
  state: GatheringState,
  actionId: string,
  diceCost: number,
  npCost: number,
  lpCost: number,
  isRapid: boolean
): GatheringState {
  // Check if the action can be used
  if (!canUseAction(state, actionId, diceCost, npCost, lpCost, isRapid)) {
    return state;
  }
  
  // Apply costs
  const newState = { ...state };
  
  // Reduce dice
  newState.diceRemaining -= diceCost;
  
  // Reduce NP
  newState.currentNP -= npCost;
  
  // Reduce LP
  newState.currentLP -= lpCost;
  
  // Add action to used actions list
  newState.usedActions = [...newState.usedActions, actionId];
  
  return newState;
}

/**
 * Convert points from one type to another
 * @param state Current gathering state
 * @param fromType Source point type ('np' or 'lp')
 * @param toType Target point type ('lp' or 'np')
 * @param amount Amount to convert (number or 'all')
 * @param maxAmount Optional maximum amount to convert
 * @returns Updated gathering state
 */
export function convertPoints(
  state: GatheringState,
  fromType: 'np' | 'lp',
  toType: 'np' | 'lp',
  amount: number | 'all',
  maxAmount?: number
): GatheringState {
  const newState = { ...state };
  let pointsToConvert: number;
  
  // Determine amount to convert
  if (amount === 'all') {
    pointsToConvert = fromType === 'np' ? state.currentNP : state.currentLP;
  } else {
    pointsToConvert = amount as number;
  }
  
  // Apply optional maximum
  if (maxAmount !== undefined) {
    pointsToConvert = Math.min(pointsToConvert, maxAmount);
  }
  
  // Ensure we don't convert more points than available
  pointsToConvert = Math.min(
    pointsToConvert,
    fromType === 'np' ? state.currentNP : state.currentLP
  );
  
  // Convert the points
  if (fromType === 'np' && toType === 'lp') {
    newState.currentNP -= pointsToConvert;
    newState.currentLP += pointsToConvert;
  } else if (fromType === 'lp' && toType === 'np') {
    newState.currentLP -= pointsToConvert;
    newState.currentNP += pointsToConvert;
  }
  
  return newState;
}
