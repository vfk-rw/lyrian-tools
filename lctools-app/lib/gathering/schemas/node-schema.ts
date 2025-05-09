/**
 * Schema definitions for declarative node variations
 */

/**
 * Declarative definition of a node variation
 */
export interface DeclarativeNodeVariation {
  id: string;
  name: string;
  description: string;
  roll_range: [number, number]; // The range of d20 rolls that trigger this variation [min, max]
  
  // Modifier properties
  modifiers: {
    dice_modifier?: number;
    yield_multiplier?: number;
    lucky_yield_multiplier?: number;
    
    // Special behavior flags
    is_explosive?: boolean;
    is_hazardous?: boolean;
    is_barren?: boolean;
    is_obscured?: boolean;
    is_muddy?: boolean;
    is_arcane?: boolean;
    is_volatile?: boolean;
    is_deep?: boolean;
    is_hardened?: boolean;
    is_alloy?: boolean;
    is_exposed?: boolean;
    is_rich?: boolean;
  };
  
  // Custom effect to apply when this variation is active
  // This is serialized as a string in the JSON but will be parsed into a function
  effect_code?: string;
}