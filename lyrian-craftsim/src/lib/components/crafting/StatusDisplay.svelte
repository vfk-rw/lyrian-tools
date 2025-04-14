<script>
    // @ts-nocheck
    import { specialMaterials } from '$lib/data';
    // Import state getters from the shared module
    import {
        getState,
        getIsCrafting,
        getCraftResult,
        resetSimulator
    } from '$lib/data/crafting-state.svelte.js';
    
    // Create reactive derivations
    let state = $derived(getState());
    let isCrafting = $derived(getIsCrafting());
    let craftResult = $derived(getCraftResult());
    
    // Props just for event handler delegation
    let { onReset } = $props();
    
    // Map the provided event handler to onclick for Svelte 5 compatibility
    const resetClick = () => onReset ? onReset() : resetSimulator();
</script>

<div class="section">
    <div class="status-header">
        <h2>Current Status</h2>
        {#if isCrafting}
            <button class="danger-button reset-button" onclick={resetClick}>Reset</button>
        {/if}
    </div>
    <div class="status-row">
        <div class="status-item narrow-status">
            <div class="status-label">Dice</div>
            <div class="status-value">{state.diceRemaining} / {state.initialDice}</div>
        </div>
        <div class="status-item narrow-status">
            <div class="status-label">Crafting Points</div>
            <div class="status-value">{state.craftingPoints} / {state.craftingHP}</div>
        </div>
        <div class="status-item">
            <div class="status-label">Bonuses</div>
            <div class="status-value">{state.bonuses.length > 0 ? state.bonuses.join(', ') : 'None'}</div>
        </div>
        <div class="status-item">
            <div class="status-label">Alloys</div>
            <div class="status-value">{state.alloys.length > 0 ? state.alloys.map(a => specialMaterials[a]?.effect || a).join('; ') : 'None'}</div>
        </div>
    </div>
    {#if craftResult}
        <div class="result-box {craftResult === 'Success' ? 'success' : 'failure'}">
            <span class="result-text">Result: {craftResult}!</span>
        </div>
    {/if}
</div>
