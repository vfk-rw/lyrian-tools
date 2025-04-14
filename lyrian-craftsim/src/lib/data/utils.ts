import type { CraftingState } from '../types';

/**
 * Rolls a d10.
 */
export function rollD10(): number {
    return Math.floor(Math.random() * 10) + 1;
}

/**
 * Performs a standard crafting check.
 */
export function performCraftingCheck(state: CraftingState): { roll: number; pointsAdded: number } {
    const roll = rollD10();
    const pointsAdded = roll + state.craftingSkill + state.expertise;
    return { roll, pointsAdded };
}

/**
 * Logs a message to the crafting log.
 */
export function logMessage(state: CraftingState, message: string): CraftingState {
    return { ...state, log: [...state.log, message] };
}
