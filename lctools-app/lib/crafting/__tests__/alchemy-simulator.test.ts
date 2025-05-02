import { jsonCraftingActions } from '../data-loader';
import { initialCraftingState } from '../state';

describe('Alchemy Simulator Integration Tests', () => {
  const actions = jsonCraftingActions;

  it('Stone Grinding applies to a healing potion', () => {
    const state = JSON.parse(JSON.stringify(initialCraftingState));
    state.itemType = 'potion';
    state.isHealing = true;
    state.craftingPoints = 15;

    const result = actions['stone-grinding'].effect(state);

    expect(result.bonuses).toContain('+3 Healing');
    expect(result.craftingPoints).toBe(0);
    expect(result.usedActions).toContain('stone-grinding');
  });

  it('Pressurization applies to an AOE flask', () => {
    const state = JSON.parse(JSON.stringify(initialCraftingState));
    state.itemType = 'flask';
    state.isAOE = true;
    state.craftingPoints = 15;

    const result = actions['pressurization'].effect(state);

    expect(result.bonuses).toContain('+5ft Area');
    expect(result.craftingPoints).toBe(0);
    expect(result.usedActions).toContain('pressurization');
  });

  it('Volatile Flask applies to a damaging flask', () => {
    const state = JSON.parse(JSON.stringify(initialCraftingState));
    state.itemType = 'flask';
    state.isDamaging = true;
    state.craftingPoints = 15;

    const result = actions['volatile-flask'].effect(state);

    expect(result.bonuses).toContain('+3 Damage');
    expect(result.craftingPoints).toBe(0);
    expect(result.usedActions).toContain('volatile-flask');
  });

  it('Detoxify Elixir applies to an elixir', () => {
    const state = JSON.parse(JSON.stringify(initialCraftingState));
    state.itemType = 'elixir';
    state.craftingPoints = 15;

    const result = actions['detoxify-elixir'].effect(state);

    expect(result.bonuses).toContain('-2 Toxicity');
    expect(result.craftingPoints).toBe(0);
    expect(result.usedActions).toContain('detoxify-elixir');
  });

  it('Efficient Dilution always applies to any item', () => {
    const state = JSON.parse(JSON.stringify(initialCraftingState));
    state.itemType = 'salve';
    state.craftingPoints = 15;

    const result = actions['efficient-dilution'].effect(state);

    expect(result.bonuses).toContain('+1 Extra');
    expect(result.craftingPoints).toBe(0);
    expect(result.usedActions).toContain('efficient-dilution');
  });

  // Alchemeister actions
  it('Masterful Dilution applies correctly', () => {
    const state = JSON.parse(JSON.stringify(initialCraftingState));
    state.alchemeisterLevel = 1;
    state.craftingPoints = 30;

    const result = actions['masterful-dilution'].effect(state);

    expect(result.bonuses).toContain('+1 Extra');
    expect(result.craftingPoints).toBe(0);
    expect(result.usedActions).toContain('masterful-dilution');
  });

  it('Distillation upgrades a +3 Healing bonus to +5', () => {
    const state = JSON.parse(JSON.stringify(initialCraftingState));
    state.itemType = 'potion';
    state.isHealing = true;
    state.alchemeisterLevel = 1;
    state.bonuses = ['+3 Healing'];
    state.craftingPoints = 30;

    const result = actions['distillation'].effect(state);

    expect(result.bonuses).toContain('+5 Healing');
    expect(result.bonuses).not.toContain('+3 Healing');
    expect(result.usedActions).toContain('distillation');
  });

  it('Explosive Lining upgrades +5ft Area to +10ft Area for an AOE flask', () => {
    const state = JSON.parse(JSON.stringify(initialCraftingState));
    state.itemType = 'flask';
    state.isAOE = true;
    state.alchemeisterLevel = 1;
    state.bonuses = ['+5ft Area'];
    state.craftingPoints = 15;

    const result = actions['explosive-lining'].effect(state);

    expect(result.bonuses).toContain('+10ft Area');
    expect(result.bonuses).not.toContain('+5ft Area');
    expect(result.usedActions).toContain('explosive-lining');
  });

  it('Purify Elixir upgrades -2 Toxicity to -5 Toxicity for a detoxified elixir', () => {
    const state = JSON.parse(JSON.stringify(initialCraftingState));
    state.itemType = 'elixir';
    state.alchemeisterLevel = 1;
    state.bonuses = ['-2 Toxicity'];
    state.craftingPoints = 30;

    const result = actions['purify-elixir'].effect(state);

    expect(result.bonuses).toContain('-5 Toxicity');
    expect(result.bonuses).not.toContain('-2 Toxicity');
    expect(result.usedActions).toContain('purify-elixir');
  });

  it('Detailed Finish prerequisite only when last dice', () => {
    const state1 = JSON.parse(JSON.stringify(initialCraftingState));
    state1.alchemeisterLevel = 6;
    state1.diceRemaining = 2;

    expect(actions['detailed-finish'].prerequisite?.(state1)).toBe(false);

    const state2 = JSON.parse(JSON.stringify(initialCraftingState));
    state2.alchemeisterLevel = 6;
    state2.diceRemaining = 1;

    expect(actions['detailed-finish'].prerequisite?.(state2)).toBe(true);

    const result = actions['detailed-finish'].effect(state2);
    expect(result.diceRemaining).toBe(0);
  });
});
