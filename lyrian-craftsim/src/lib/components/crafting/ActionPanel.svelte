<script>
    // @ts-nocheck
    import { craftingActions, specialMaterials } from '$lib/data';
    // Import state getters from the shared module
    import {
        getState,
        getIsCrafting,
        getSelectedAlloy,
        performAction
    } from '$lib/data/crafting-state.svelte.js';
    
    // Create reactive derivations
    let state = $derived(getState());
    let isCrafting = $derived(getIsCrafting());
    let selectedAlloy = $derived(getSelectedAlloy());
    
    // Props just for event handler delegation
    let { onPerformAction } = $props();

    // Create Svelte 5 compatible handlers
    const handleAction = (actionId) => {
        onPerformAction ? onPerformAction(actionId) : performAction(actionId);
    };

    // Reactive value for available/filtered actions using derived
    let availableActions = $derived(Object.values(craftingActions).filter((action) => {
        if (!isCrafting) return false; // No actions if not crafting

        // Check dice cost first
        if (state.diceRemaining < action.diceCost) return false;

        // Prerequisites and duplicate checks
        if (action.requiresPrerequisite && action.prerequisite && !action.prerequisite(state)) return false;
        if (!action.isRapid && action.id !== 'basic-craft' && state.usedActions.includes(action.id)) {
            // Allow multiple uses of artisan bonus actions unless the upgrade is used
            if (action.id === 'blacksmiths-design' && state.usedActions.includes('blacksmiths-ergonomics')) return false;
            if (action.id === 'sharpening-reinforcing' && state.usedActions.includes('tempering')) return false;
            if (action.id === 'weight-balancing' && state.usedActions.includes('grip-ergonomics')) return false;
            // Block other non-rapid actions from being used multiple times
            if (!['blacksmiths-design', 'sharpening-reinforcing', 'weight-balancing'].includes(action.id)) return false;
        }

        // For points-based abilities, they should be allowed to show up if you have the level
        // The button color will indicate if you have enough points
        if (action.id === 'weapon-alloy') {
            const alloyData = specialMaterials[selectedAlloy];
            if (!alloyData || state.alloys.length > 0) return false;
            // Allow button to show if you have level, points check is handled by CSS
            const hasForgeLevel = state.forgemasterLevel >= action.classLevel;
            return hasForgeLevel;
        }

        // We always want to return true if we have the level
        // Button color will handle showing if we can afford the cost
        const hasRequiredLevel = action.className === null || 
            (action.className === 'blacksmith' && state.blacksmithLevel >= action.classLevel) ||
            (action.className === 'forgemaster' && state.forgemasterLevel >= action.classLevel);

        return hasRequiredLevel;
    }));

    // Create a local copy to track changes before updating global
    let localSelectedAlloy = $state(selectedAlloy);
    
    // Effect to sync local to global
    $effect(() => {
        if (localSelectedAlloy !== selectedAlloy) {
            // Don't directly assign to imported variable
            performAction('update-alloy-selection', localSelectedAlloy);
        }
    });
    
    // Effect to sync global to local
    $effect(() => {
        localSelectedAlloy = selectedAlloy;
    });
</script>

<div class="section">
    <h2>Actions</h2>
    <div class="action-grid">
        {#each availableActions as action (action.id)}
            {@const isAlloyAction = action.id === 'weapon-alloy'}
            {@const hasRequiredLevel = action.className === null || 
                (action.className === 'blacksmith' && state.blacksmithLevel >= action.classLevel) ||
                (action.className === 'forgemaster' && state.forgemasterLevel >= action.classLevel)}
            {@const hasPoints = isAlloyAction 
                ? state.craftingPoints >= specialMaterials[localSelectedAlloy]?.point_cost
                : action.pointsCost === 0 || state.craftingPoints >= action.pointsCost}
            {@const hasDiceAndPrereqs = state.diceRemaining >= action.diceCost && 
                (!action.requiresPrerequisite || (action.prerequisite && action.prerequisite(state)))}
            {@const isUsed = !action.isRapid && action.id !== 'basic-craft' && state.usedActions.includes(action.id)}
            {@const available = hasRequiredLevel && hasPoints && hasDiceAndPrereqs && !isUsed}
            
            <div class="action-item">
                <button
                    class={available ? "primary-button" : isUsed ? "danger-button" : hasRequiredLevel ? "warning-button" : "disabled-button"}
                    onclick={() => handleAction(action.id)}
                    disabled={!isCrafting || (!hasRequiredLevel && !hasPoints && !hasDiceAndPrereqs) || isUsed}
                    title={`${action.description}\nCost: ${isAlloyAction ? `${specialMaterials[localSelectedAlloy]?.point_cost ?? '?'} Points (${localSelectedAlloy})` : action.costText}${action.className ? `\nRequires: ${action.className} Lvl ${action.classLevel}` : ''}${action.requiresPrerequisite ? 
                        action.id === 'blacksmiths-ergonomics' ? `\nRequires: +1 Crafting bonus${state.bonuses.includes('+1 Crafting') ? ' (Ready!)' : ''}` :
                        action.id === 'tempering' ? `\nRequires: +1 Power bonus${state.bonuses.includes('+1 Power') ? ' (Ready!)' : ''}` :
                        action.id === 'grip-ergonomics' ? `\nRequires: +1 Focus bonus${state.bonuses.includes('+1 Focus') ? ' (Ready!)' : ''}` :
                        '\n(Has Prerequisite)'
                    : ''}`}
                    class:prerequisite-ready={action.requiresPrerequisite && (
                        (action.id === 'blacksmiths-ergonomics' && state.bonuses.includes('+1 Crafting')) ||
                        (action.id === 'tempering' && state.bonuses.includes('+1 Power')) ||
                        (action.id === 'grip-ergonomics' && state.bonuses.includes('+1 Focus'))
                    )}
                >
                    {action.name} ({isAlloyAction ? `${specialMaterials[localSelectedAlloy]?.point_cost ?? 'X'} Points` : action.costText})
                </button>
                {#if isAlloyAction}
                    <select 
                        class="alloy-select" 
                        bind:value={localSelectedAlloy} 
                        disabled={!isCrafting || state.alloys.length > 0}
                    >
                        {#each Object.entries(specialMaterials) as [key, material]}
                            {@const cost = material.point_cost}
                            {@const disabledReason = state.craftingPoints < cost ? ` (Need ${cost} Pts)` : state.alloys.includes(key) ? ' (Already Added)' : ''}
                            <option value={key} disabled={state.craftingPoints < cost || state.alloys.includes(key)}>
                                {key} ({cost} Pts){disabledReason}
                            </option>
                        {/each}
                    </select>
                {/if}
            </div>
        {/each}
    </div>
</div>
