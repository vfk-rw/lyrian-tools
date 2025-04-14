/**
 * Schema definitions for materials in declarative format
 */

// Define the declarative base material schema
export interface DeclarativeBaseMaterial {
  id: string;
  name: string;
  effect_text: string;
  bonus_dice: number;
}

// Define the declarative special material schema
export interface DeclarativeSpecialMaterial {
  id: string;
  name: string;
  point_cost: number;
  dice_cost: number;
  effect: string;
  // For special handling if needed
  special_effect?: string;
}
