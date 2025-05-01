/**
 * Main interpreter for converting declarative actions into executable actions
 */

import type { CraftingState, CraftingAction, CraftingActions } from '../types';
import type { DeclarativeAction } from '../schemas/action-schema';
import { executeEffects } from './effect-interpreter';
import { evaluateConditions } from './condition-interpreter';

/**
 * Convert a declarative action into an executable action
 */
export function createExecutableAction(declarativeAction: DeclarativeAction): CraftingAction {
  return {
    id: declarativeAction.id,
    name: declarativeAction.name,
    costText: declarativeAction.cost_text,
    className: declarativeAction.class_name,
    classLevel: declarativeAction.class_level,
    diceCost: declarativeAction.dice_cost,
    pointsCost: declarativeAction.points_cost,
    isRapid: declarativeAction.is_rapid,
    requiresPrerequisite: declarativeAction.requires_prerequisite,
    description: declarativeAction.description,
    
    // Create the prerequisite function if needed
    prerequisite: declarativeAction.conditions 
      ? (state: CraftingState) => evaluateConditions(declarativeAction.conditions, state)
      : undefined,
    
    // Create the effect function
    effect: (state: CraftingState, additionalData?: unknown) => {
      // Pass additionalData through for effects needing extra context
      return executeEffects(declarativeAction.effects, state, additionalData);
    }
  };
}

/**
 * Convert an array of declarative actions into executable actions
 */
export function createExecutableActions(declarativeActions: DeclarativeAction[]): CraftingActions {
  const result: CraftingActions = {};
  
  for (const declarativeAction of declarativeActions) {
    result[declarativeAction.id] = createExecutableAction(declarativeAction);
  }
  
  return result;
}

/**
 * Load actions from a JSON string
 */
export function loadActionsFromJson(json: string): CraftingActions {
  try {
    const declarativeActions = JSON.parse(json) as DeclarativeAction[];
    return createExecutableActions(declarativeActions);
  } catch (error) {
    console.error('Error loading actions from JSON:', error);
    return {};
  }
}

/**
 * Load actions from a JSON file
 */
export async function loadActionsFromFile(path: string): Promise<CraftingActions> {
  try {
    const response = await fetch(path);
    const json = await response.text();
    return loadActionsFromJson(json);
  } catch (error) {
    console.error(`Error loading actions from file ${path}:`, error);
    return {};
  }
}
