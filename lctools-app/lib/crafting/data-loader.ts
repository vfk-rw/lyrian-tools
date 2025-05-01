/**
 * Data loader module that loads crafting data from JSON files and converts it to executable structures
 */

import type { CraftingActions, SpecialMaterials, BaseMaterial } from '../types';
import { createExecutableActions, loadActionsFromJson } from './interpreters/action-interpreter';
import { 
  createBaseMaterials, 
  createSpecialMaterials,
  loadBaseMaterialsFromJson,
  loadSpecialMaterialsFromJson
} from './interpreters/material-interpreter';

// Import JSON data
import baseMatJson from './json/base-materials.json';
import specialMatJson from './json/special-materials.json';
import actionsJson from './json/crafting-actions.json';

// Convert JSON to string for our loader functions
const baseMatString = JSON.stringify(baseMatJson);
const specialMatString = JSON.stringify(specialMatJson);
const actionsString = JSON.stringify(actionsJson);

// Parse and convert the data into executable structures
export const jsonBaseMaterials: { [key: string]: BaseMaterial } = loadBaseMaterialsFromJson(baseMatString);
export const jsonSpecialMaterials: SpecialMaterials = loadSpecialMaterialsFromJson(specialMatString);
export const jsonCraftingActions: CraftingActions = loadActionsFromJson(actionsString);

/**
 * Load data from custom JSON files (useful for mods or user-defined content)
 */
export async function loadCustomData(
  baseMaterialsPath?: string,
  specialMaterialsPath?: string,
  actionsPath?: string
): Promise<{
  baseMaterials: { [key: string]: BaseMaterial },
  specialMaterials: SpecialMaterials,
  craftingActions: CraftingActions
}> {
  // Start with default data
  let customBaseMaterials = { ...jsonBaseMaterials };
  let customSpecialMaterials = { ...jsonSpecialMaterials };
  let customCraftingActions = { ...jsonCraftingActions };
  
  try {
    // Load custom base materials if provided
    if (baseMaterialsPath) {
      const response = await fetch(baseMaterialsPath);
      const json = await response.text();
      const materials = loadBaseMaterialsFromJson(json);
      customBaseMaterials = { ...customBaseMaterials, ...materials };
    }
    
    // Load custom special materials if provided
    if (specialMaterialsPath) {
      const response = await fetch(specialMaterialsPath);
      const json = await response.text();
      const materials = loadSpecialMaterialsFromJson(json);
      customSpecialMaterials = { ...customSpecialMaterials, ...materials };
    }
    
    // Load custom actions if provided
    if (actionsPath) {
      const response = await fetch(actionsPath);
      const json = await response.text();
      const actions = loadActionsFromJson(json);
      customCraftingActions = { ...customCraftingActions, ...actions };
    }
  } catch (error) {
    console.error('Error loading custom data:', error);
  }
  
  return {
    baseMaterials: customBaseMaterials,
    specialMaterials: customSpecialMaterials,
    craftingActions: customCraftingActions
  };
}

/**
 * Validate a custom data JSON file against the expected schema
 * Returns true if valid, false if not
 */
export function validateCustomDataFile(json: string, type: 'baseMaterials' | 'specialMaterials' | 'actions'): boolean {
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
      switch (type) {
        case 'baseMaterials':
          if (!item.name || !item.effect_text || typeof item.bonus_dice !== 'number') {
            console.error('Base material must have name, effect_text, and bonus_dice properties');
            return false;
          }
          break;
          
        case 'specialMaterials':
          if (!item.name || !item.effect || typeof item.point_cost !== 'number' || typeof item.dice_cost !== 'number') {
            console.error('Special material must have name, effect, point_cost, and dice_cost properties');
            return false;
          }
          break;
          
        case 'actions':
          if (!item.name || !item.cost_text || typeof item.dice_cost !== 'number' || 
              typeof item.points_cost !== 'number' || typeof item.class_level !== 'number' ||
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
          break;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error validating data:', error);
    return false;
  }
}
