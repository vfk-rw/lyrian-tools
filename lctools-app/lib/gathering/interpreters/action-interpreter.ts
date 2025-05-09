/**
 * Main interpreter for converting declarative gathering actions into executable actions
 */

import type { GatheringState, GatheringAction, GatheringActions } from '../types';
import type { DeclarativeGatheringAction } from '../schemas/action-schema';
import { executeEffects } from './effect-interpreter';
import { evaluateConditions } from './condition-interpreter';
import { executeGatheringAction } from '../utils';

/**
 * Convert a declarative action into an executable action
 */
export function createExecutableAction(declarativeAction: DeclarativeGatheringAction): GatheringAction {
  const diceCost = declarativeAction.dice_cost;
  const nodePointsCost = declarativeAction.node_points_cost;
  const luckyPointsCost = declarativeAction.lucky_points_cost;
  
  return {
    id: declarativeAction.id,
    name: declarativeAction.name,
    costText: declarativeAction.cost_text,
    className: declarativeAction.class_name,
    classLevel: declarativeAction.class_level,
    diceCost: diceCost,
    nodePointsCost: nodePointsCost,
    luckyPointsCost: luckyPointsCost,
    isRapid: declarativeAction.is_rapid,
    requiresPrerequisite: declarativeAction.requires_prerequisite,
    description: declarativeAction.description,
    
    // Create the prerequisite function if needed
    prerequisite: declarativeAction.conditions 
      ? (state: GatheringState) => evaluateConditions(declarativeAction.conditions || [], state)
      : undefined,
    
    // Create the effect function
    effect: (state: GatheringState) => {
      // Prevent any actions after gathering ended
      if (state.diceRemaining <= 0) return state;
      
      // Apply costs and track action usage
      const newState = executeGatheringAction(
        state,
        declarativeAction.id,
        diceCost,
        nodePointsCost,
        luckyPointsCost
      );
      
      // Check if the action was actually executed (costs were applied)
      if (state === newState) return state;
      
      // Execute effects
      return executeEffects(declarativeAction.effects, newState);
    }
  };
}

/**
 * Convert an array of declarative actions into executable actions
 */
export function createExecutableActions(declarativeActions: DeclarativeGatheringAction[]): GatheringActions {
  const result: GatheringActions = {};
  
  for (const declarativeAction of declarativeActions) {
    result[declarativeAction.id] = createExecutableAction(declarativeAction);
  }
  
  return result;
}

/**
 * Load actions from a JSON string
 */
export function loadActionsFromJson(json: string): GatheringActions {
  try {
    const declarativeActions = JSON.parse(json) as DeclarativeGatheringAction[];
    return createExecutableActions(declarativeActions);
  } catch (error) {
    console.error('Error loading actions from JSON:', error);
    return {};
  }
}

/**
 * Load actions from a JSON file
 */
export async function loadActionsFromFile(path: string): Promise<GatheringActions> {
  try {
    const response = await fetch(path);
    const json = await response.text();
    return loadActionsFromJson(json);
  } catch (error) {
    console.error(`Error loading actions from file ${path}:`, error);
    return {};
  }
}