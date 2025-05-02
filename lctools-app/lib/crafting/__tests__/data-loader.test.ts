import baseMatJson from '../json/base-materials.json';
import specialMatJson from '../json/special-materials.json';
import baseActionsJson from '../json/base-actions.json';
import blacksmithActionsJson from '../json/blacksmith-actions.json';
import forgemasterActionsJson from '../json/forgemaster-actions.json';
import alchemistActionsJson from '../json/alchemist-actions.json';
import alchemeisterActionsJson from '../json/alchemeister-actions.json';

import { loadBaseMaterialsFromJson, loadSpecialMaterialsFromJson } from '../interpreters/material-interpreter';
import { loadActionsFromJson } from '../interpreters/action-interpreter';
import { initialCraftingState } from '../state';
import type { CraftingState } from '../types';

const actionsJson = [
  ...baseActionsJson,
  ...blacksmithActionsJson,
  ...forgemasterActionsJson,
  ...alchemistActionsJson,
  ...alchemeisterActionsJson
];

describe('Crafting data loader', () => {
  describe('Base materials', () => {
    const jsonString = JSON.stringify(baseMatJson);
    const materials = loadBaseMaterialsFromJson(jsonString);

    it('loads all base materials', () => {
      const ids = baseMatJson.map(item => item.id);
      expect(Object.keys(materials).sort()).toEqual(ids.sort());
    });

    it('maps fields correctly', () => {
      baseMatJson.forEach(raw => {
        const mat = materials[raw.id];
        expect(mat).toBeDefined();
        expect(mat.name).toBe(raw.name);
        expect(mat.effectText).toBe(raw.effect_text);
        expect(mat.bonusDice).toBe(raw.bonus_dice);
      });
    });
  });

  describe('Special materials', () => {
    const jsonString = JSON.stringify(specialMatJson);
    const materials = loadSpecialMaterialsFromJson(jsonString);

    it('loads all special materials', () => {
      const ids = specialMatJson.map(item => item.id);
      expect(Object.keys(materials).sort()).toEqual(ids.sort());
    });

    it('maps fields correctly', () => {
      specialMatJson.forEach(raw => {
        const mat = materials[raw.id];
        expect(mat).toBeDefined();
        expect(mat.point_cost).toBe(raw.point_cost);
        expect(mat.dice_cost).toBe(raw.dice_cost);
        expect(mat.effect).toBe(raw.effect);
      });
    });
  });

  describe('Crafting actions', () => {
    const jsonString = JSON.stringify(actionsJson);
    const actions = loadActionsFromJson(jsonString);

    it('loads all actions', () => {
      const ids = actionsJson.map(a => a.id);
      expect(Object.keys(actions).sort()).toEqual(ids.sort());
    });

    it('each action has an executable effect function', () => {
      Object.values(actions).forEach(action => {
        expect(typeof action.effect).toBe('function');
      });
    });

    it('basic-craft decrements dice and adds points', () => {
      const state: CraftingState = {
        ...initialCraftingState,
        craftingPoints: 0,
        diceRemaining: initialCraftingState.diceRemaining
      };
      const result = actions['basic-craft'].effect(state);
      expect(result.diceRemaining).toBe(state.diceRemaining - 1);
      expect(result.craftingPoints).toBeGreaterThanOrEqual(1);
      expect(result.log.some((entry: string) => entry.includes('Used Basic Craft'))).toBe(true);
    });
  });
});
