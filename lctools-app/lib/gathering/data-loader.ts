/**
 * Data loader module that loads gathering data from JSON files and converts it to executable structures
 */

import type { GatheringActions, NodeVariations } from './types';
import { loadActionsFromJson } from './interpreters/action-interpreter';
import { loadNodeVariationsFromJson } from './interpreters/node-interpreter';

// Import JSON data
import baseActionsJson from './json/base-actions.json';
import classActionsJson from './json/class-actions.json';
import nodeVariationsJson from './json/node-variations.json';

// Convert JSON to string for our loader functions
const baseActionsString = JSON.stringify(baseActionsJson);
const classActionsString = JSON.stringify(classActionsJson);
const nodeVariationsString = JSON.stringify(nodeVariationsJson);

// Parse and convert data into executable structures
const baseActions = loadActionsFromJson(baseActionsString);
const classActions = loadActionsFromJson(classActionsString);
// Merge base and class-specific actions
export const jsonGatheringActions: GatheringActions = { ...baseActions, ...classActions };
export const jsonNodeVariations: NodeVariations = loadNodeVariationsFromJson(nodeVariationsString);

// Prepare for class-specific action files in future
const classActionFiles = [
  { name: 'base', data: baseActionsJson },
  { name: 'class', data: classActionsJson }
];

/**0
 * Get actions for a specific class
 */
export function getActionsForClass(className: string): GatheringActions {
  const matchingFile = classActionFiles.find(file => file.name === className);
  if (!matchingFile) return {};
  
  return loadActionsFromJson(JSON.stringify(matchingFile.data));
}

/**
 * Load custom data from JSON files
 */
export async function loadCustomData(
  actionsPath?: string,
  variationsPath?: string
): Promise<{
  gatheringActions: GatheringActions,
  nodeVariations: NodeVariations
}> {
  // Start with default data
  let customGatheringActions = { ...jsonGatheringActions };
  let customNodeVariations = { ...jsonNodeVariations };
  
  try {
    // Load custom actions if provided
    if (actionsPath) {
      const response = await fetch(actionsPath);
      const json = await response.text();
      const actions = loadActionsFromJson(json);
      customGatheringActions = { ...customGatheringActions, ...actions };
    }
    
    // Load custom node variations if provided
    if (variationsPath) {
      const response = await fetch(variationsPath);
      const json = await response.text();
      const variations = loadNodeVariationsFromJson(json);
      customNodeVariations = { ...customNodeVariations, ...variations };
    }
  } catch (error) {
    console.error('Error loading custom data:', error);
  }
  
  return {
    gatheringActions: customGatheringActions,
    nodeVariations: customNodeVariations
  };
}

/**
 * Validate a custom data JSON file against the expected schema
 */
export function validateCustomDataFile(json: string, type: 'actions' | 'variations'): boolean {
  try {
    const data = JSON.parse(json);
    
    // Ensure it's an array
    if (!Array.isArray(data)) {
      console.error('Data must be an array');
      return false;
    }
    
    // Check each item in the array
    for (const item of data) {
      // Common validation for all types
      if (!item.id || typeof item.id !== 'string') {
        console.error('Each item must have a string "id" property');
        return false;
      }
      
      // Type-specific validation
      if (type === 'actions') {
        if (!item.name || !item.cost_text || typeof item.dice_cost !== 'number' ||
            typeof item.node_points_cost !== 'number' || typeof item.lucky_points_cost !== 'number' ||
            typeof item.is_rapid !== 'boolean' || typeof item.requires_prerequisite !== 'boolean' ||
            !item.description || !Array.isArray(item.effects)) {
          console.error('Action must have all required properties');
          return false;
        }
        
        // Check effects
        for (const effect of item.effects) {
          if (!effect.type) {
            console.error('Each effect must have a type');
            return false;
          }
        }
        
        // Check conditions if present
        if (item.conditions) {
          if (!Array.isArray(item.conditions)) {
            console.error('Conditions must be an array');
            return false;
          }
          
          for (const condition of item.conditions) {
            if (!condition.type) {
              console.error('Each condition must have a type');
              return false;
            }
          }
        }
      } else if (type === 'variations') {
        if (!item.name || !item.description || !Array.isArray(item.roll_range) ||
            item.roll_range.length !== 2 || !item.modifiers) {
          console.error('Node variation must have all required properties');
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error validating data:', error);
    return false;
  }
}