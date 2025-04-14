// @ts-nocheck
import {
    initialCraftingState,
    baseMaterials,
    specialMaterials,
    craftingActions
} from './index';
import { logMessage } from './utils';

// Define state variables with Svelte 5 runes
let state = $state({ ...initialCraftingState });
let selectedAlloy = $state(Object.keys(specialMaterials)[0]);
let isCrafting = $state(false);
let craftResult = $state(null);

// --- Getter functions ---
function getState() {
    return state;
}

function getSelectedAlloy() {
    return selectedAlloy;
}

function getIsCrafting() {
    return isCrafting;
}

function getCraftResult() {
    return craftResult;
}

// --- Action functions ---
function initializeState() {
    const baseMaterialData = baseMaterials[state.baseMaterial];
    const bonusDice = baseMaterialData ? baseMaterialData.bonusDice : 0;
    const startingDice = 5 + bonusDice; // Base 5 + material bonus

    state = {
        ...initialCraftingState, // Reset to defaults
        // Overwrite with user inputs
        itemValue: state.itemValue,
        craftingHP: state.craftingHP,
        baseMaterial: state.baseMaterial,
        craftingSkill: state.craftingSkill,
        expertise: state.expertise,
        blacksmithLevel: state.blacksmithLevel,
        forgemasterLevel: state.forgemasterLevel,
        // Calculated values
        diceRemaining: startingDice,
        initialDice: startingDice,
        log: [`Crafting started with ${startingDice} dice (${baseMaterials[state.baseMaterial]?.name}).`]
    };
    isCrafting = true;
    craftResult = null;
}

function resetSimulator() {
    // Keep user inputs reset the rest
    const currentInputs = {
        itemValue: state.itemValue,
        craftingHP: state.craftingHP,
        baseMaterial: state.baseMaterial,
        craftingSkill: state.craftingSkill,
        expertise: state.expertise,
        blacksmithLevel: state.blacksmithLevel,
        forgemasterLevel: state.forgemasterLevel
    };
    state = { ...initialCraftingState, ...currentInputs };
    isCrafting = false;
    craftResult = null;
    selectedAlloy = Object.keys(specialMaterials)[0]; // Reset alloy selection
}

function performAction(actionId, additionalData) {
    // Special case for updating alloy selection
    if (actionId === 'update-alloy-selection' && additionalData) {
        selectedAlloy = additionalData;
        return;
    }
    
    if (!isCrafting) return;

    const action = craftingActions[actionId];
    if (!action) return;

    let newState;

    // Check level requirements first
    const hasLevel = action.className === null ||
        (action.className === 'blacksmith' && state.blacksmithLevel >= action.classLevel) ||
        (action.className === 'forgemaster' && state.forgemasterLevel >= action.classLevel);

    if (!hasLevel) {
        const className = action.className === 'blacksmith' ? 'Blacksmith' : 'Forgemaster';
        newState = { ...state, log: [...state.log, `Error: Requires ${className} Level ${action.classLevel}`] };
        state = newState;
        return;
    }

    // Handle Weapon Alloy specially due to dynamic cost and selection
    if (action.id === 'weapon-alloy') {
        const alloyData = specialMaterials[selectedAlloy];
        if (!alloyData) {
            newState = { ...state, log: [...state.log, 'Error: Selected alloy data not found.'] };
        } else if (state.craftingPoints < alloyData.point_cost) {
            newState = { ...state, log: [...state.log, `Error: Not enough points for ${selectedAlloy} (${alloyData.point_cost} needed).`] };
        } else if (state.alloys.length > 0) {
            newState = { ...state, log: [...state.log, `Error: An alloy has already been added.`] };
        } else {
            // Pass the additional parameters to the weapon alloy effect
            newState = action.effect(state, selectedAlloy, alloyData);
        }
    } else {
        // Check various requirements and show appropriate error messages
        if (state.diceRemaining < action.diceCost) {
            newState = { ...state, log: [...state.log, `Error: Not enough dice (need ${action.diceCost}, have ${state.diceRemaining})`] };
        } else if (action.pointsCost > 0 && state.craftingPoints < action.pointsCost) {
            newState = { ...state, log: [...state.log, `Error: Not enough points (need ${action.pointsCost}, have ${state.craftingPoints})`] };
        } else if (!action.isRapid && state.usedActions.includes(action.id)) {
            newState = { ...state, log: [...state.log, `Error: ${action.name} has already been used this craft`] };
        } else if (action.requiresPrerequisite && action.prerequisite && !action.prerequisite(state)) {
            newState = { ...state, log: [...state.log, `Error: Missing prerequisite for ${action.name}`] };
        } else {
            newState = action.effect(state);
        }
    }

    state = newState;

    // Check for end condition
    if (state.diceRemaining <= 0 && isCrafting) { // Only end if still crafting
        endCrafting();
    }
}

function endCrafting() {
    isCrafting = false;
    if (state.craftingPoints >= state.craftingHP) {
        craftResult = 'Success';
        state = { ...state, log: [...state.log, `--- Crafting Finished: SUCCESS! (${state.craftingPoints}/${state.craftingHP}) ---`] };
    } else {
        craftResult = 'Failure';
        state = { ...state, log: [...state.log, `--- Crafting Finished: FAILURE! (${state.craftingPoints}/${state.craftingHP}) ---`] };
    }
    // Ensure dice are 0 if crafting ended prematurely (e.g. Standard Finish)
    state = { ...state, diceRemaining: 0 };
}

// Setter methods for direct property updates
function updateStateProperty(key, value) {
    if (key in state) {
        state = { ...state, [key]: value };
    }
}

// Export getter functions and action functions
export {
    getState,
    getSelectedAlloy,
    getIsCrafting,
    getCraftResult,
    updateStateProperty,
    initializeState,
    resetSimulator,
    performAction,
    endCrafting
};
