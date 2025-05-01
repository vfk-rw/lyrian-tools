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
    
    // Update state to meet blacksmiths-design prerequisites (class level)
    state.blacksmithLevel = 1;
    state.craftingPoints = 30; // Enough points to use the action

    // Initially should be eligible for standard finish
    expect(actions['standard-finish'].prerequisite?.(state)).toBe(true);

    // Apply Blacksmith's Design to add a bonus
    state = actions['blacksmiths-design'].effect(state);
    expect(state.bonuses).toContain('+1 Crafting'); // Verify the bonus was added
    
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
    state.craftingPoints = 50; // Ensure enough points for the 30-point cost

    expect(actions['blacksmiths-ergonomics'].prerequisite?.(state)).toBe(true);
    state = actions['blacksmiths-ergonomics'].effect(state);

    // Bonus upgraded to +2 Crafting, and craftingPoints decreased
    expect(state.bonuses).toContain('+2 Crafting');
    expect(state.bonuses).not.toContain('+1 Crafting');
    expect(state.craftingPoints).toBe(50 - 30); // 20 points remaining after paying 30
  });

  it('Steady Craft and Steady Craft II are mutually exclusive', () => {
    const actions = jsonCraftingActions;
    let state = JSON.parse(JSON.stringify(initialCraftingState));
    
    // Set blacksmith level high enough to use Steady Craft II
    state.blacksmithLevel = 6;
    state.diceRemaining = 5; // Ensure we have enough dice
    
    // First check: Initially both should be available
    expect(actions['steady-craft'].prerequisite?.(state)).toBe(true);
    expect(actions['steady-craft-2'].prerequisite?.(state)).toBe(true);
    
    // Test 1: Use Steady Craft, then Steady Craft II should be blocked
    let state1 = JSON.parse(JSON.stringify(state));
    state1 = actions['steady-craft'].effect(state1);
    expect(state1.usedActions).toContain('steady-craft');
    expect(actions['steady-craft-2'].prerequisite?.(state1)).toBe(false);
    
    // Test 2: Use Steady Craft II, then Steady Craft should be blocked
    let state2 = JSON.parse(JSON.stringify(state));
    state2 = actions['steady-craft-2'].effect(state2);
    expect(state2.usedActions).toContain('steady-craft-2');
    expect(actions['steady-craft'].prerequisite?.(state2)).toBe(false);
  });

  describe('Weapon Alloy cost deduction for all special materials', () => {
    const actions = jsonCraftingActions;
    const materials = specialMaterials as Array<{ id: string; point_cost: number; dice_cost: number }>;

    materials.forEach(({ id, point_cost, dice_cost }) => {
      // Skip titanium in the generic test since it has special behavior
      if (id === 'titanium') return;
      
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
    
    // Special test for titanium which adds points instead of deducting them
    it(`handles titanium's special behavior by adding points`, () => {
      let state = JSON.parse(JSON.stringify(initialCraftingState));
      const initialPoints = state.craftingPoints;
      const initialDice = state.diceRemaining;
      const id = 'titanium';
      
      state = actions['weapon-alloy'].effect(state, id);
      
      expect(state.alloys).toContain(id);
      expect(state.craftingPoints).toBe(initialPoints + 30);  // Adds 30 instead of deducting
      expect(state.diceRemaining).toBe(initialDice);  // No dice cost
      expect(state.usedActions).toContain('weapon-alloy');
    });
    
    it('applies Titanium special effect to add +30 crafting points', () => {
      let state = JSON.parse(JSON.stringify(initialCraftingState));
      const initialPoints = state.craftingPoints;
      
      state = actions['weapon-alloy'].effect(state, 'titanium');
      
      // Titanium should have 0 cost but give +30 points
      expect(state.craftingPoints).toBe(initialPoints + 30);
      expect(state.bonuses).toContain('Titanium');
      expect(state.log).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Used Weapon Alloy: Added Titanium')
        ])
      );
    });
    
    it('adds alloy name to bonuses array and creates detailed log message', () => {
      let state = JSON.parse(JSON.stringify(initialCraftingState));
      
      // Test with Cold Iron
      state = actions['weapon-alloy'].effect(state, 'cold-iron');
      
      expect(state.bonuses).toContain('Cold Iron');
      expect(state.log).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Used Weapon Alloy: Added Cold Iron')
        ])
      );
      
      // Test another alloy (Silver)
      state = JSON.parse(JSON.stringify(initialCraftingState));
      state = actions['weapon-alloy'].effect(state, 'silver');
      
      expect(state.bonuses).toContain('Silver');
      expect(state.log).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Used Weapon Alloy: Added Silver')
        ])
      );
    });
  });

  describe('Action resource and end-craft safeguards', () => {
    const actions = jsonCraftingActions;
    const stateInit = JSON.parse(JSON.stringify(initialCraftingState));

    it('blocks Blacksmiths-Design when insufficient points', () => {
      const state = { ...stateInit, craftingPoints: 0 };
      const before = { ...state };
      const result = actions['blacksmiths-design'].effect(state);
      // state should not change
      expect(result.craftingPoints).toBe(before.craftingPoints);
      expect(result.bonuses).toEqual(before.bonuses);
    });

    it('blocks dice from going negative', () => {
      let state = { ...stateInit, diceRemaining: 1 };
      // use basic-craft once: dice->0
      state = actions['basic-craft'].effect(state);
      expect(state.diceRemaining).toBe(0);
      // second call should not reduce further
      const after = actions['basic-craft'].effect(state);
      expect(after.diceRemaining).toBe(0);
    });

    it('blocks actions after Standard Finish', () => {
      const state = { ...stateInit, craftingPoints: stateInit.craftingHP / 2, diceRemaining: 5 };
      // apply at least one basic craft to get points
      const postCraft = actions['basic-craft'].effect(state);
      // now apply standard-finish
      const finished = actions['standard-finish'].effect(postCraft);
      expect(finished.diceRemaining).toBe(0);
      const pointsAfterFinish = finished.craftingPoints;
      // attempt another basic craft
      const after = actions['basic-craft'].effect(finished);
      expect(after.craftingPoints).toBe(pointsAfterFinish);
      expect(after.diceRemaining).toBe(0);
    });
  });
});