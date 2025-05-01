/**
 * Interpreter for converting declarative materials into usable material objects
 */

import type { BaseMaterial, SpecialMaterial, SpecialMaterials } from '../types';
import type { DeclarativeBaseMaterial, DeclarativeSpecialMaterial } from '../schemas/material-schema';

/**
 * Convert a declarative base material into a usable base material
 */
export function createBaseMaterial(declarativeMaterial: DeclarativeBaseMaterial): BaseMaterial {
  return {
    name: declarativeMaterial.name,
    effectText: declarativeMaterial.effect_text,
    bonusDice: declarativeMaterial.bonus_dice
  };
}

/**
 * Convert declarative base materials into usable base materials
 */
export function createBaseMaterials(
  declarativeMaterials: DeclarativeBaseMaterial[]
): { [key: string]: BaseMaterial } {
  const result: { [key: string]: BaseMaterial } = {};
  
  for (const declarativeMaterial of declarativeMaterials) {
    result[declarativeMaterial.id] = createBaseMaterial(declarativeMaterial);
  }
  
  return result;
}

/**
 * Convert a declarative special material into a usable special material
 */
export function createSpecialMaterial(declarativeMaterial: DeclarativeSpecialMaterial): SpecialMaterial {
  return {
    point_cost: declarativeMaterial.point_cost,
    dice_cost: declarativeMaterial.dice_cost,
    effect: declarativeMaterial.effect
    // If we need special handling of special_effect, it would be processed here
  };
}

/**
 * Convert declarative special materials into usable special materials
 */
export function createSpecialMaterials(
  declarativeMaterials: DeclarativeSpecialMaterial[]
): SpecialMaterials {
  const result: SpecialMaterials = {};
  
  for (const declarativeMaterial of declarativeMaterials) {
    result[declarativeMaterial.id] = createSpecialMaterial(declarativeMaterial);
  }
  
  return result;
}

/**
 * Load base materials from a JSON string
 */
export function loadBaseMaterialsFromJson(json: string): { [key: string]: BaseMaterial } {
  try {
    const declarativeMaterials = JSON.parse(json) as DeclarativeBaseMaterial[];
    return createBaseMaterials(declarativeMaterials);
  } catch (error) {
    console.error('Error loading base materials from JSON:', error);
    return {};
  }
}

/**
 * Load special materials from a JSON string
 */
export function loadSpecialMaterialsFromJson(json: string): SpecialMaterials {
  try {
    const declarativeMaterials = JSON.parse(json) as DeclarativeSpecialMaterial[];
    return createSpecialMaterials(declarativeMaterials);
  } catch (error) {
    console.error('Error loading special materials from JSON:', error);
    return {};
  }
}

/**
 * Load base materials from a JSON file
 */
export async function loadBaseMaterialsFromFile(path: string): Promise<{ [key: string]: BaseMaterial }> {
  try {
    const response = await fetch(path);
    const json = await response.text();
    return loadBaseMaterialsFromJson(json);
  } catch (error) {
    console.error(`Error loading base materials from file ${path}:`, error);
    return {};
  }
}

/**
 * Load special materials from a JSON file
 */
export async function loadSpecialMaterialsFromFile(path: string): Promise<SpecialMaterials> {
  try {
    const response = await fetch(path);
    const json = await response.text();
    return loadSpecialMaterialsFromJson(json);
  } catch (error) {
    console.error(`Error loading special materials from file ${path}:`, error);
    return {};
  }
}
