/**
 * State management for the gathering system
 */

import type { GatheringState, ResourceNode } from './types';

/**
 * Initial gathering state with default values
 */
export const initialGatheringState: GatheringState = {
  // Node properties
  nodeHP: 3,
  nodePoints: 40,
  luckyPoints: 15,
  nodeType: 'ore',
  
  // Current gathering progress
  currentNP: 0,
  currentLP: 0,
  diceRemaining: 5,
  
  // Gatherer properties
  gatheringSkill: 5,
  expertise: 0,
  toolBonus: 0,
  
  // Session tracking
  usedActions: [],
  variations: [],
  bonuses: [],
  log: [],
  
  // Result tracking
  success: false,
  luckySuccess: false,
  normalYield: 0,
  luckyYield: 0,
  yieldType: '',
  luckyYieldType: '',
};

/**
 * Create a new gathering state from a resource node
 */
export function createGatheringState(node: ResourceNode, skill: number = 5, expertise: number = 0, toolBonus: number = 0): GatheringState {
  return {
    // Node properties
    nodeHP: node.hp,
    nodePoints: node.nodePoints,
    luckyPoints: node.luckyPoints,
    nodeType: node.type,
    
    // Current gathering progress
    currentNP: 0,
    currentLP: 0,
    diceRemaining: 5,
    
    // Gatherer properties
    gatheringSkill: skill,
    expertise: expertise,
    toolBonus: toolBonus,
    
    // Session tracking
    usedActions: [],
    variations: node.variations || [],
    bonuses: [],
    log: [],
    
    // Result tracking
    success: false,
    luckySuccess: false,
    normalYield: node.yield,
    luckyYield: node.luckyYield,
    yieldType: node.yieldType,
    luckyYieldType: node.luckyYieldType,
  };
}

/**
 * Check if gathering was successful
 */
export function checkGatheringSuccess(state: GatheringState): GatheringState {
  const newState = { ...state };
  
  // Check if node points were cleared
  newState.success = newState.currentNP >= newState.nodePoints;
  
  // Check if lucky points were cleared
  newState.luckySuccess = newState.currentLP >= newState.luckyPoints && newState.success;
  
  return newState;
}

/**
 * Add a log message to the gathering state
 */
export function logMessage(state: GatheringState, message: string): GatheringState {
  return {
    ...state,
    log: [...state.log, message]
  };
}

/**
 * Complete the gathering session and calculate results
 */
export function completeGathering(state: GatheringState): GatheringState {
  let newState = { ...state };

  // Check success
  newState = checkGatheringSuccess(newState);
  
  // Reduce node HP
  newState = {
    ...newState,
    nodeHP: Math.max(0, newState.nodeHP - 1)
  };
  
  // Add final log message based on success/failure
  if (newState.success) {
    const yieldMessage = `Successfully gathered ${newState.normalYield} units of ${newState.yieldType}.`;
    newState = logMessage(newState, yieldMessage);
    
    if (newState.luckySuccess) {
      const luckyYieldMessage = `Also gathered ${newState.luckyYield} units of ${newState.luckyYieldType}!`;
      newState = logMessage(newState, luckyYieldMessage);
    }
  } else {
    newState = logMessage(newState, "Failed to gather enough materials from the node.");
  }
  
  return newState;
}