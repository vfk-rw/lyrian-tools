/**
 * Interpreter for handling node variations
 */

import type { GatheringState, NodeVariation, NodeVariations } from '../types';
import type { DeclarativeNodeVariation } from '../schemas/node-schema';
import { logMessage } from '../state';

/**
 * Convert a declarative node variation into an executable node variation
 */
export function createNodeVariation(declarativeVariation: DeclarativeNodeVariation): NodeVariation {
  return {
    id: declarativeVariation.id,
    name: declarativeVariation.name,
    description: declarativeVariation.description,
    
    // Create a function that applies this variation's effects to the gathering state
    applyEffect: (state: GatheringState): GatheringState => {
      let newState = { ...state };
      
      // Add a log message about the variation
      newState = logMessage(newState, `Node variation: ${declarativeVariation.name} - ${declarativeVariation.description}`);
      
      // Apply dice modifier if present
      if (declarativeVariation.modifiers.dice_modifier) {
        newState.diceRemaining += declarativeVariation.modifiers.dice_modifier;
        // Ensure minimum of 1 dice
        newState.diceRemaining = Math.max(1, newState.diceRemaining);
        
        // Add log message
        const diceMessage = declarativeVariation.modifiers.dice_modifier > 0
          ? `+${declarativeVariation.modifiers.dice_modifier} Strike Dice`
          : `${declarativeVariation.modifiers.dice_modifier} Strike Dice`;
        newState = logMessage(newState, diceMessage);
      }
      
      // Apply yield multipliers if present
      if (declarativeVariation.modifiers.yield_multiplier && declarativeVariation.modifiers.yield_multiplier !== 1) {
        newState.normalYield = Math.floor(newState.normalYield * declarativeVariation.modifiers.yield_multiplier);
      }
      
      if (declarativeVariation.modifiers.lucky_yield_multiplier && declarativeVariation.modifiers.lucky_yield_multiplier !== 1) {
        newState.luckyYield = Math.floor(newState.luckyYield * declarativeVariation.modifiers.lucky_yield_multiplier);
      }
      
      // Handle special variation flags
      if (declarativeVariation.modifiers.is_barren) {
        newState.luckyYield = 0;
        newState = logMessage(newState, "This node has no rare materials.");
      }
      
      if (declarativeVariation.modifiers.is_muddy) {
        newState.diceRemaining -= 1;
        newState.diceRemaining = Math.max(1, newState.diceRemaining);
        // We'd also need to upgrade dice to d20 but that's handled in the roll effect handler
        newState = logMessage(newState, "Muddy node: -1 Strike Dice, but all gathering dice are upgraded to d20.");
      }
      
      if (declarativeVariation.modifiers.is_arcane) {
        newState = logMessage(newState, "Arcane node: Abilities that grant LP now give NP, and vice versa.");
      }
      
      if (declarativeVariation.modifiers.is_hardened) {
        // Double tool bonus
        newState.toolBonus *= 2;
        newState = logMessage(newState, "Hardened node: Tool bonuses are doubled.");
      }
      
      // Handle custom effect code if present
      if (declarativeVariation.effect_code) {
        try {
          // This is a simplified approach - in production you'd want a more secure way to handle this
          const effectFunction = new Function('state', declarativeVariation.effect_code);
          const effectResult = effectFunction(newState);
          if (effectResult) {
            newState = effectResult;
          }
        } catch (error) {
          console.error(`Error executing custom effect for variation ${declarativeVariation.id}:`, error);
        }
      }
      
      return newState;
    }
  };
}

/**
 * Convert an array of declarative node variations into executable node variations
 */
export function createNodeVariations(declarativeVariations: DeclarativeNodeVariation[]): NodeVariations {
  const result: NodeVariations = {};
  
  for (const declarativeVariation of declarativeVariations) {
    result[declarativeVariation.id] = createNodeVariation(declarativeVariation);
  }
  
  return result;
}

/**
 * Load node variations from a JSON string
 */
export function loadNodeVariationsFromJson(json: string): NodeVariations {
  try {
    const declarativeVariations = JSON.parse(json) as DeclarativeNodeVariation[];
    return createNodeVariations(declarativeVariations);
  } catch (error) {
    console.error('Error loading node variations from JSON:', error);
    return {};
  }
}

/**
 * Load node variations from a JSON file
 */
export async function loadNodeVariationsFromFile(path: string): Promise<NodeVariations> {
  try {
    const response = await fetch(path);
    const json = await response.text();
    return loadNodeVariationsFromJson(json);
  } catch (error) {
    console.error(`Error loading node variations from file ${path}:`, error);
    return {};
  }
}

/**
 * Generate a random node variation based on a d20 roll
 */
export function generateRandomNodeVariation(variations: NodeVariations, roll?: number): NodeVariation | null {
  // Use provided roll or generate a new one
  const dieRoll = roll || Math.floor(Math.random() * 20) + 1;
  
  // Find matching variation
  const variation = Object.values(variations).find(v => {
    // Check if roll_range exists before accessing it
    const rollRange = (v as { roll_range?: [number, number] }).roll_range;
    if (!rollRange || !Array.isArray(rollRange) || rollRange.length !== 2) {
      return false;
    }
    return dieRoll >= rollRange[0] && dieRoll <= rollRange[1];
  });
  
  return variation || null;
}