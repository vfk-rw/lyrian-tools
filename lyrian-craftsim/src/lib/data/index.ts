// Re-export original modules for backward compatibility
export * from './materials';
export * from './actions';
export * from './utils';
export * from './state';

// Export new schema definitions
export * from './schemas/action-schema';
export * from './schemas/material-schema';

// Export interpreters
export * from './interpreters/action-interpreter';
export * from './interpreters/material-interpreter';
export * from './interpreters/effect-interpreter';
export * from './interpreters/condition-interpreter';

// Export data loader
export * from './data-loader';

// Documentation for JSON-based crafting data system
/**
 * # Lyrian Craftsim JSON Data System
 * 
 * This system allows for defining crafting actions, materials, and class skills
 * in a JSON format that non-programmers can edit.
 * 
 * ## Data Types
 * 
 * ### Crafting Actions
 * Located in `/src/lib/data/json/crafting-actions.json`
 * 
 * Actions are defined with:
 * - Basic properties (id, name, costs, requirements)
 * - Conditions that determine if an action can be used
 * - Effects that define what happens when an action is used
 * 
 * ### Base Materials
 * Located in `/src/lib/data/json/base-materials.json`
 * 
 * Base materials are defined with:
 * - id and name
 * - effect_text (description)
 * - bonus_dice (additional dice provided)
 * 
 * ### Special Materials
 * Located in `/src/lib/data/json/special-materials.json`
 * 
 * Special materials (alloys) are defined with:
 * - id and name
 * - point_cost and dice_cost
 * - effect (description)
 * - special_effect (optional identifier for special handling)
 * 
 * ## How to Add New Content
 * 
 * 1. Edit the appropriate JSON file
 * 2. Follow the existing format and schemas
 * 3. For complex actions, refer to existing examples
 * 
 * ## Loading Custom Data
 * 
 * You can load custom data at runtime using:
 * 
 * ```typescript
 * import { loadCustomData } from './data-loader';
 * 
 * // Load custom data
 * const customData = await loadCustomData(
 *   'path/to/custom-base-materials.json',
 *   'path/to/custom-special-materials.json',
 *   'path/to/custom-actions.json'
 * );
 * ```
 */
