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
    diceCost,
    nodePointsCost,
    luckyPointsCost,
    isRapid: declarativeAction.is_rapid,
    requiresPrerequisite: declarativeAction.requires_prerequisite,
    description: declarativeAction.description,
    
    prerequisite: declarativeAction.conditions
      ? (state: GatheringState) => evaluateConditions(declarativeAction.conditions || [], state)
      : undefined,

    effect: (state: GatheringState) => {
      // Do nothing if out of dice
      if (state.diceRemaining <= 0) {
        return state;
      }
      // Apply costs
      const afterCost = executeGatheringAction(
        state,
        declarativeAction.id,
        diceCost,
        nodePointsCost,
        luckyPointsCost,
        declarativeAction.is_rapid
      );
      if (afterCost === state) {
        return state;
      }
      // Execute declared effects
      const initialNP = afterCost.currentNP;
      const afterEffects = executeEffects(declarativeAction.effects, afterCost);
      // Novice's Perseverance: redirect to LP if toggled
      if (
        declarativeAction.id === 'novices-perseverance' &&
        afterEffects.perseveranceTarget === 'LP'
      ) {
        const added = afterEffects.currentNP - initialNP;
        return {
          ...afterEffects,
          currentNP: initialNP,
          currentLP: afterEffects.currentLP + added,
          log: afterEffects.log.map(msg =>
            msg.includes("Used Novice's Perseverance")
              ? msg.replace('Node Points', 'Lucky Points')
              : msg
          )
        };
      }
      return afterEffects;
    }
  };
}

/**
 * Convert an array of declarative actions into executable actions
 */
export function createExecutableActions(
  declarativeActions: DeclarativeGatheringAction[]
): GatheringActions {
  const result: GatheringActions = {};
  for (const action of declarativeActions) {
    result[action.id] = createExecutableAction(action);
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
  } catch {
    return {};
  }
}
