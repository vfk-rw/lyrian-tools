/**
 * Interpreter for action effects to convert declarative effects into executable functions
 */

import type { CraftingState } from '../types';
import { rollD10, logMessage } from '../utils';
import type { 
  Effect,
  ModifyEffect,
  RollEffect,
  CalculateEffect,
  LogEffect,
  EndCraftingEffect,
  AddBonusEffect,
  AddAlloyEffect,
  UpgradeBonusEffect
} from '../schemas/action-schema';

// Variable store for temporary values during effect execution
type VariableStore = Record<string, unknown>;

/**
 * Execute a single effect and return the updated state and variable store
 */
export function executeEffect(
  effect: Effect,
  state: CraftingState,
  variables: VariableStore,
  additionalData?: unknown
): { state: CraftingState; variables: VariableStore } {
  switch (effect.type) {
    case 'modify':
      return executeModifyEffect(effect as ModifyEffect, state, variables);
    case 'roll':
      return executeRollEffect(effect as RollEffect, state, variables);
    case 'calculate':
      return executeCalculateEffect(effect as CalculateEffect, state, variables);
    case 'log':
      return executeLogEffect(effect as LogEffect, state, variables);
    case 'end_crafting':
      return executeEndCraftingEffect(effect as EndCraftingEffect, state, variables);
    case 'add_bonus':
      return executeAddBonusEffect(effect as AddBonusEffect, state, variables);
    case 'add_alloy':
      return executeAddAlloyEffect(effect as AddAlloyEffect, state, variables, additionalData);
    case 'upgrade_bonus':
      return executeUpgradeBonusEffect(effect as UpgradeBonusEffect, state, variables);
    default:
      console.warn(`Unknown effect type: ${(effect as Effect).type}`);
      return { state, variables };
  }
}

/**
 * Execute all effects in sequence, passing the state and variables between them
 */
export function executeEffects(
  effects: Effect[],
  state: CraftingState,
  additionalData?: unknown
): CraftingState {
  let currentState = { ...state };
  let variables: VariableStore = {};
  
  // Store initial values for reference
  variables['initialCraftingPoints'] = currentState.craftingPoints;
  variables['initialDiceRemaining'] = currentState.diceRemaining;
  
  for (const effect of effects) {
    const result = executeEffect(effect, currentState, variables, additionalData);
    currentState = result.state;
    variables = result.variables;
  }
  
  return currentState;
}

// --- Individual effect executors ---

function executeModifyEffect(
  effect: ModifyEffect,
  state: CraftingState,
  variables: VariableStore
): { state: CraftingState, variables: VariableStore } {
  let newState = { ...state };
  const target = effect.target as keyof CraftingState;

  // Get the current value
  let currentValue: unknown;
  if (target in state) {
    currentValue = state[target];
  } else if (target in variables) {
    currentValue = variables[target as string];
  } else {
    console.warn(`Target not found: ${target}`);
    return { state: newState, variables };
  }
  
  // Get the value to apply
  let valueToApply: unknown;
  if (typeof effect.value === 'string' && effect.value.startsWith('{') && effect.value.endsWith('}')) {
    const variableName = effect.value.slice(1, -1);
    valueToApply = variables[variableName];
  } else {
    valueToApply = effect.value;
  }

  // Handle array types specially
  if (Array.isArray(currentValue)) {
    if (effect.operation === 'add') {
      currentValue = [...currentValue, valueToApply];
    } else if (effect.operation === 'set') {
      currentValue = Array.isArray(valueToApply) ? [...valueToApply] : [valueToApply];
    }
    // Other operations don't make sense for arrays
  } else {
    // Handle numeric operations
    switch (effect.operation) {
      case 'add':
        currentValue = Number(currentValue) + Number(valueToApply);
        break;
      case 'subtract':
        currentValue = Number(currentValue) - Number(valueToApply);
        break;
      case 'multiply':
        currentValue = Number(currentValue) * Number(valueToApply);
        break;
      case 'divide':
        currentValue = Number(currentValue) / Number(valueToApply);
        break;
      case 'set':
        currentValue = valueToApply;
        break;
      default:
        console.warn(`Unknown operation: ${effect.operation}`);
    }
  }
  
  // Update the state or variables
  if (target in state) {
    newState = { ...newState, [target]: currentValue };
  } else {
    variables = { ...variables, [target as string]: currentValue };
  }
  
  return { state: newState, variables };
}

function executeRollEffect(
  effect: RollEffect,
  state: CraftingState,
  variables: VariableStore
): { state: CraftingState, variables: VariableStore } {
  // Roll dice based on sides and count
  const { sides, count } = effect.dice;
  let total = 0;
  
  // Track individual rolls
  const rolls: number[] = [];
  
  for (let i = 0; i < count; i++) {
    const roll = sides === 10 ? rollD10() : Math.floor(Math.random() * sides) + 1;
    rolls.push(roll);
    total += roll;
  }
  
  // Store the total roll and individual rolls
  const newVariables = { 
    ...variables, 
    [effect.store_as]: total,
    [`${effect.store_as}_rolls`]: rolls 
  };
  
  return { state, variables: newVariables };
}

function executeCalculateEffect(
  effect: CalculateEffect,
  state: CraftingState,
  variables: VariableStore
): { state: CraftingState, variables: VariableStore } {
  // Parse the formula and replace variables
  let formula = effect.formula;
  
  // Replace state variables
  for (const key in state) {
    formula = formula.replace(new RegExp(`{${key}}`, 'g'), String(state[key as keyof CraftingState]));
  }
  
  // Replace temporary variables
  for (const key in variables) {
    formula = formula.replace(new RegExp(`{${key}}`, 'g'), String(variables[key]));
  }
  
  // Evaluate the formula (safely)
  try {
    // Use Function constructor instead of eval for slightly better security
    const result = new Function(`return ${formula}`)();
    
    // Store the result
    const newVariables = { ...variables, [effect.store_as]: result };
    
    return { state, variables: newVariables };
  } catch (error) {
    console.error(`Error evaluating formula: ${formula}`, error);
    return { state, variables };
  }
}

function executeLogEffect(
  effect: LogEffect,
  state: CraftingState,
  variables: VariableStore
): { state: CraftingState, variables: VariableStore } {
  // Replace variables in the message
  let message = effect.message;
  
  // Replace state variables
  for (const key in state) {
    message = message.replace(new RegExp(`{${key}}`, 'g'), String(state[key as keyof CraftingState]));
  }
  
  // Replace temporary variables
  for (const key in variables) {
    message = message.replace(new RegExp(`{${key}}`, 'g'), String(variables[key]));
  }
  
  // Add the log message to state
  const newState = logMessage(state, message);
  
  return { state: newState, variables };
}

function executeEndCraftingEffect(
  effect: EndCraftingEffect,
  state: CraftingState,
  variables: VariableStore
): { state: CraftingState, variables: VariableStore } {
  // Set dice remaining to 0 to end crafting
  const newState = { ...state, diceRemaining: 0 };
  
  return { state: newState, variables };
}

function executeAddBonusEffect(
  effect: AddBonusEffect,
  state: CraftingState,
  variables: VariableStore
): { state: CraftingState, variables: VariableStore } {
  // Add the bonus to the state's bonuses array
  const newState = { 
    ...state, 
    bonuses: [...state.bonuses, effect.bonus]
  };
  
  return { state: newState, variables };
}

function executeAddAlloyEffect(
  effect: AddAlloyEffect,
  state: CraftingState,
  variables: VariableStore,
  additionalData?: unknown
): { state: CraftingState, variables: VariableStore } {
  let alloyId = effect.alloy;
  
  // Handle variable references
  if (typeof alloyId === 'string' && alloyId.startsWith('{') && alloyId.endsWith('}')) {
    const variableName = alloyId.slice(1, -1);
    if (variableName === 'selected_alloy' && additionalData) {
      alloyId = additionalData as string;
    } else if (variables[variableName]) {
      alloyId = variables[variableName] as string;
    }
  }
  
  // Add the alloy to the state's alloys array
  const newState = { 
    ...state, 
    alloys: [...state.alloys, alloyId] 
  };
  
  return { state: newState, variables };
}

function executeUpgradeBonusEffect(
  effect: UpgradeBonusEffect,
  state: CraftingState,
  variables: VariableStore
): { state: CraftingState, variables: VariableStore } {
  const bonusIndex = state.bonuses.indexOf(effect.from);
  const newBonuses = [...state.bonuses];
  
  if (bonusIndex > -1) {
    // Replace the old bonus with the upgraded one
    newBonuses.splice(bonusIndex, 1, effect.to);
  }
  
  const newState = { ...state, bonuses: newBonuses };
  
  return { state: newState, variables };
}
