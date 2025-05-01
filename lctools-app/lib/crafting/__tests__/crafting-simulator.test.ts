import { jsonCraftingActions } from '../data-loader';
import { initialCraftingState } from '../state';
import * as utils from '../utils';
import specialMaterials from '../json/special-materials.json';

describe('Crafting Simulator Integration Tests', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('performs two high Basic Craft actions to reach crafting HP', () => {
    // Force rollD10 to always return 10
    jest.spyOn(utils, 'rollD10').mockReturnValue(10);
    const actions = jsonCraftingActions;
    let state = JSON.parse(JSON.stringify(initialCraftingState));

    // Perform basic-craft twice
    state = actions['basic-craft'].effect(state);
    state = actions['basic-craft'].effect(state);

    // With roll=10, skill=5, expertise=10 each craft adds 25 points
    expect(state.craftingPoints).toBe(50);
    expect(state.diceRemaining).toBe(initialCraftingState.diceRemaining - 2);
    expect(state.log).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Used Basic Craft. Rolled 10. Added 25 points')
      ])
    );
  });

  it('Standard Finish prerequisite blocks when bonus exists', () => {
    const actions = jsonCraftingActions;
    let state = JSON.parse(JSON.stringify(initialCraftingState));

    // Apply Blacksmith's Design to add a bonus
    expect(actions['blacksmiths-design'].prerequisite?.(state)).toBe(true);
    state = actions['blacksmiths-design'].effect(state);

    // Now standard-finish should be ineligible
    expect(actions['standard-finish'].prerequisite?.(state)).toBe(false);
  });

  it('Weapon Alloy adds selected alloy and enforces single use', () => {
    const actions = jsonCraftingActions;
    let state = JSON.parse(JSON.stringify(initialCraftingState));
    const alloyId = 'cold-iron';

    // Initial prereqs ok
    expect(actions['weapon-alloy'].prerequisite?.(state)).toBe(true);
    state = actions['weapon-alloy'].effect(state, alloyId);
    expect(state.alloys).toContain(alloyId);
    expect(state.usedActions).toContain('weapon-alloy');

    // Second call prereq now false
    expect(actions['weapon-alloy'].prerequisite?.(state)).toBe(false);
  });

  it('Blacksmith’s Ergonomics requires forgemaster level and existing +1 bonus', () => {
    const actions = jsonCraftingActions;
    let state = JSON.parse(JSON.stringify(initialCraftingState));

    // Initial forgemasterLevel=0, no bonus
    expect(actions['blacksmiths-ergonomics'].prerequisite?.(state)).toBe(false);

    // Raise forgemasterLevel and add a +1 Crafting bonus manually
    state.forgemasterLevel = 1;
    state.bonuses.push('+1 Crafting');

    expect(actions['blacksmiths-ergonomics'].prerequisite?.(state)).toBe(true);
    state = actions['blacksmiths-ergonomics'].effect(state);

    // Bonus upgraded to +2 Crafting, and craftingPoints decreased
    expect(state.bonuses).toContain('+2 Crafting');
    expect(state.bonuses).not.toContain('+1 Crafting');
    expect(state.craftingPoints).toBe(initialCraftingState.craftingPoints - 30);
  });

  describe('Weapon Alloy cost deduction for all special materials', () => {
    const actions = jsonCraftingActions;
    const materials = specialMaterials as Array<{ id: string; point_cost: number; dice_cost: number }>;

    materials.forEach(({ id, point_cost, dice_cost }) => {
      it(`deducts cost correctly when using alloy '${id}'`, () => {
        let state = JSON.parse(JSON.stringify(initialCraftingState));
        const initialPoints = state.craftingPoints;
        const initialDice = state.diceRemaining;

        state = actions['weapon-alloy'].effect(state, id);

        expect(state.alloys).toContain(id);
        expect(state.craftingPoints).toBe(initialPoints - point_cost);
        expect(state.diceRemaining).toBe(initialDice - dice_cost);
        expect(state.usedActions).toContain('weapon-alloy');
      });
    });
  });
});