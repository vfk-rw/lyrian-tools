/**
 * Interpreter for action effects to convert declarative effects into executable functions
 */

import type { GatheringState } from '../types';
import { rollD10, distributePoints, convertPoints, addGatheringPoints } from '../utils';
import { logMessage } from '../state';
import type { 
  Effect,
  ModifyEffect,
  RollEffect,
  CalculateEffect,
  LogEffect,
  EndGatheringEffect,
  DistributePointsEffect,
  ConvertPointsEffect
} from '../schemas/action-schema';

// Variable store for temporary values during effect execution
type VariableStore = Record<string, unknown>;

/**
 * Execute a single effect and return the updated state and variable store
 */
export function executeEffect(
  effect: Effect,
  state: GatheringState,
  variables: VariableStore
): { state: GatheringState; variables: VariableStore } {
  switch (effect.type) {
    case 'modify':
      return executeModifyEffect(effect as ModifyEffect, state, variables);
    case 'roll':
      return executeRollEffect(effect as RollEffect, state, variables);
    case 'calculate':
      return executeCalculateEffect(effect as CalculateEffect, state, variables);
    case 'log':
      return executeLogEffect(effect as LogEffect, state, variables);
    case 'end_gathering':
      return executeEndGatheringEffect(effect as EndGatheringEffect, state, variables);
    case 'distribute_points':
      return executeDistributePointsEffect(effect as DistributePointsEffect, state, variables);
    case 'convert_points':
      return executeConvertPointsEffect(effect as ConvertPointsEffect, state, variables);
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
  state: GatheringState
): GatheringState {
  let currentState = { ...state };
  let variables: VariableStore = {};
  
  // Store initial values for reference
  variables['initialNP'] = currentState.currentNP;
  variables['initialLP'] = currentState.currentLP;
  variables['initialDiceRemaining'] = currentState.diceRemaining;
  
  // Calculate bonus variables
  variables['ironFocusBonus'] = currentState.bonuses.includes('Iron Focus') ? 5 : 0;
  
  for (const effect of effects) {
    const result = executeEffect(effect, currentState, variables);
    currentState = result.state;
    variables = result.variables;
    
    // Recalculate bonus variables if bonuses change
    if (effect.type === 'modify' && (effect as ModifyEffect).target === 'bonuses') {
      variables['ironFocusBonus'] = currentState.bonuses.includes('Iron Focus') ? 5 : 0;
    }
  }
  
  return currentState;
}

// --- Individual effect executors ---

function executeModifyEffect(
  effect: ModifyEffect,
  state: GatheringState,
  variables: VariableStore
): { state: GatheringState, variables: VariableStore } {
  let newState = { ...state };
  const target = effect.target as keyof GatheringState;

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
  state: GatheringState,
  variables: VariableStore
): { state: GatheringState, variables: VariableStore } {
  // Roll dice based on sides and count
  const { sides, count } = effect.dice;
  let total = 0;
  
  // Track individual rolls
  const rolls: number[] = [];
  
  for (let i = 0; i < count; i++) {
    const roll = sides === 10 ? rollD10() : Math.floor(Math.random() * sides) + 1;
    
    // Check for volatile node variation which affects d10 rolls
    let modifiedRoll = roll;
    if (state.variations.includes('volatile') && sides === 10) {
      modifiedRoll = (roll >= 1 && roll <= 5) ? 1 : (roll >= 6 && roll <= 10) ? 10 : roll;
    }
    
    rolls.push(modifiedRoll);
    total += modifiedRoll;
  }
  
  // Store individual rolls and total separately
  const newVariables = { 
    ...variables, 
    [effect.store_as]: rolls,          // individual rolls array
    [`${effect.store_as}_total`]: total  // total of rolls
  };
  
  return { state, variables: newVariables };
}

function executeCalculateEffect(
  effect: CalculateEffect,
  state: GatheringState,
  variables: VariableStore
): { state: GatheringState, variables: VariableStore } {
  // Parse the formula and replace variables
  let formula = effect.formula;

  // Handle array indexing in formulas like {rolls[0]}
  formula = formula.replace(/\{(\w+)\[(\d+)\]\}/g, (_match, varName, idx) => {
    const arr = variables[varName];
    return Array.isArray(arr) ? String(arr[Number(idx)]) : '0';
  });
  
  // Replace state variables
  for (const key in state) {
    formula = formula.replace(new RegExp(`{${key}}`, 'g'), String(state[key as keyof GatheringState]));
    formula = formula.replace(new RegExp(`\\b${key}\\b`, 'g'), String(state[key as keyof GatheringState]));
  }
  
  // Replace temporary variables
  for (const key in variables) {
    formula = formula.replace(new RegExp(`{${key}}`, 'g'), String(variables[key]));
    formula = formula.replace(new RegExp(`\\b${key}\\b`, 'g'), String(variables[key]));
  }
  
  // Evaluate the formula (safely)
  try {
    // Use Function constructor instead of eval for slightly better security
    const result = new Function(`return ${formula}`)();
    
    // Store the result
    const newVariables = { ...variables, [effect.store_as]: result };
    
    return { state, variables: newVariables };
  } catch (error) {
    console.warn(`Error evaluating formula: ${formula}`, error);
    return { state, variables };
  }
}

function executeLogEffect(
  effect: LogEffect,
  state: GatheringState,
  variables: VariableStore
): { state: GatheringState, variables: VariableStore } {
  // Replace variables in the message
  let message = effect.message;
  
  // Handle array indexing in messages like {rolls[0]}
  message = message.replace(/\{(\w+)\[(\d+)\]\}/g, (_match, varName, idx) => {
    const arr = variables[varName];
    return Array.isArray(arr) ? String(arr[Number(idx)]) : '0';
  });
  
  // Replace state variables
  for (const key in state) {
    message = message.replace(new RegExp(`{${key}}`, 'g'), String(state[key as keyof GatheringState]));
  }
  
  // Replace temporary variables
  for (const key in variables) {
    message = message.replace(new RegExp(`{${key}}`, 'g'), String(variables[key]));
  }
  
  // Add the log message to state
  const newState = logMessage(state, message);
  
  return { state: newState, variables };
}

function executeEndGatheringEffect(
  effect: EndGatheringEffect,
  state: GatheringState,
  variables: VariableStore
): { state: GatheringState, variables: VariableStore } {
  // Set dice remaining to 0 to end gathering
  const newState = { ...state, diceRemaining: 0 };
  
  return { state: newState, variables };
}

function executeDistributePointsEffect(
  effect: DistributePointsEffect,
  state: GatheringState,
  variables: VariableStore
): { state: GatheringState, variables: VariableStore } {
  // Get total points to distribute
  let totalPoints: number;
  if (typeof effect.total_points === 'string' && effect.total_points.startsWith('{') && effect.total_points.endsWith('}')) {
    const varName = effect.total_points.slice(1, -1);
    totalPoints = Number(variables[varName]) || 0;
  } else {
    totalPoints = Number(effect.total_points);
  }
  
  // Get NP and LP amounts
  let npAmount = effect.np_points;
  let lpAmount = effect.lp_points;
  
  // If they're variable references, resolve them
  if (typeof npAmount === 'string' && npAmount.startsWith('{') && npAmount.endsWith('}')) {
    const varName = npAmount.slice(1, -1);
    npAmount = variables[varName] as number | string;
  }
  
  if (typeof lpAmount === 'string' && lpAmount.startsWith('{') && lpAmount.endsWith('}')) {
    const varName = lpAmount.slice(1, -1);
    lpAmount = variables[varName] as number | string;
  }
  
  // Calculate distribution
  const distribution = distributePoints(totalPoints, npAmount, lpAmount);
  
  // Apply distribution to state
  const newState = addGatheringPoints(state, distribution.np, distribution.lp);
  
  // Store values in variables for reference
  const newVariables = {
    ...variables,
    'npAdded': distribution.np,
    'lpAdded': distribution.lp
  };
  
  return { state: newState, variables: newVariables };
}

function executeConvertPointsEffect(
  effect: ConvertPointsEffect,
  state: GatheringState,
  variables: VariableStore
): { state: GatheringState, variables: VariableStore } {
  // Get amount to convert
  let resolvedAmount: number | 'all';
  const amountInput = effect.amount; // amountInput is string | number

  if (typeof amountInput === 'number') {
    resolvedAmount = amountInput;
  } else if (amountInput === 'all') { // If effect.amount is literally "all"
    resolvedAmount = 'all';
  } else if (typeof amountInput === 'string' && amountInput.startsWith('{') && amountInput.endsWith('}')) {
    // If effect.amount is a variable reference like "{varName}"
    const varName = amountInput.slice(1, -1);
    if (varName === 'all') { // If the variable name itself is "all", e.g. "{all}"
      resolvedAmount = 'all';
    } else {
      const variableValue = variables[varName];
      if (typeof variableValue === 'number') {
        resolvedAmount = variableValue;
      } else if (variableValue === 'all') { // If the resolved variable's value is "all"
        resolvedAmount = 'all';
      } else {
        // Fallback if variable is not a number and not "all"
        console.warn(`Variable '${varName}' (value: ${variableValue}) for amount is not a number or 'all'. Defaulting to 0.`);
        resolvedAmount = 0;
      }
    }
  } else {
    // If amountInput is a string but not 'all' and not a variable placeholder.
    // This case should ideally not occur if schema/data is correct.
    console.warn(`Invalid string value for amount: '${amountInput}'. Defaulting to 0.`);
    resolvedAmount = 0;
  }

  // Convert points
  const newState = convertPoints(
    state,
    effect.from,
    effect.to,
    resolvedAmount, // Use the resolved and correctly typed amount
    effect.max
  );

  // Calculate how many points were actually converted
  let pointsConverted = 0;
  if (effect.from === 'np') {
    pointsConverted = state.currentNP - newState.currentNP;
  } else {
    pointsConverted = state.currentLP - newState.currentLP;
  }

  // Store value in variables for reference
  const newVariables = {
    ...variables,
    'pointsConverted': pointsConverted
  };

  return { state: newState, variables: newVariables };
}
