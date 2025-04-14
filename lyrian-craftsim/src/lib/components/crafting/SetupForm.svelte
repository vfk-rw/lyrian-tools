<script>
    // @ts-nocheck
    import { baseMaterials } from '$lib/data';
    // Import state getters from the shared module
    import { 
        getState, 
        getIsCrafting,
        initializeState,
        resetSimulator,
        updateStateProperty
    } from '$lib/data/crafting-state.svelte.js';
    
    // Create reactive derivations
    let state = $derived(getState());
    let isCrafting = $derived(getIsCrafting());
    
    // Props just for event handler delegation
    let { onStartCrafting, onReset } = $props();
    
    // Map the provided event handlers to onclick for Svelte 5 compatibility
    const startCraftingClick = () => onStartCrafting ? onStartCrafting() : initializeState();
    const resetClick = () => onReset ? onReset() : resetSimulator();
    
    // Event handlers for input changes
    function handleNumberInput(key, e) {
        const input = e.target;
        if (input) {
            updateStateProperty(key, +input.value);
        }
    }
    
    function handleSelectInput(key, e) {
        const select = e.target;
        if (select) {
            updateStateProperty(key, select.value);
        }
    }
</script>

<div class="section">
    <h2>Setup</h2>
    <div class="compact-form-grid">
        <div class="form-row">
            <div class="form-group">
                <label for="itemValue">Value:</label>
                <input 
                    id="itemValue" 
                    type="number" 
                    value={state.itemValue}
                    onchange={(e) => handleNumberInput('itemValue', e)}
                    min="1" 
                    disabled={isCrafting}
                    class="narrow-input"
                >
            </div>
            <div class="form-group">
                <label for="craftingHP">HP:</label>
                <input 
                    id="craftingHP" 
                    type="number" 
                    value={state.craftingHP}
                    onchange={(e) => handleNumberInput('craftingHP', e)}
                    min="1" 
                    disabled={isCrafting}
                    class="narrow-input"
                >
            </div>
            <div class="form-group material-group">
                <label for="baseMaterial">Material:</label>
                <select 
                    id="baseMaterial" 
                    value={state.baseMaterial}
                    onchange={(e) => handleSelectInput('baseMaterial', e)}
                    disabled={isCrafting}
                    class="material-select"
                >
                    {#each Object.entries(baseMaterials) as [key, material]}
                        <option value={key}>{material.name} ({material.effectText})</option>
                    {/each}
                </select>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label for="craftingSkill">Skill:</label>
                <input 
                    id="craftingSkill" 
                    type="number" 
                    value={state.craftingSkill}
                    onchange={(e) => handleNumberInput('craftingSkill', e)}
                    min="0" 
                    disabled={isCrafting}
                    class="very-narrow-input"
                >
            </div>
            <div class="form-group">
                <label for="expertise">Expertise:</label>
                <input 
                    id="expertise" 
                    type="number" 
                    value={state.expertise}
                    onchange={(e) => handleNumberInput('expertise', e)}
                    min="0" 
                    disabled={isCrafting}
                    class="very-narrow-input"
                >
            </div>
            <div class="form-group">
                <label for="blacksmithLevel">BS Lvl:</label>
                <input 
                    id="blacksmithLevel" 
                    type="number" 
                    value={state.blacksmithLevel}
                    onchange={(e) => handleNumberInput('blacksmithLevel', e)}
                    min="0" 
                    max="10" 
                    disabled={isCrafting}
                    class="very-narrow-input"
                >
            </div>
            <div class="form-group">
                <label for="forgemasterLevel">FM Lvl:</label>
                <input 
                    id="forgemasterLevel" 
                    type="number" 
                    value={state.forgemasterLevel}
                    onchange={(e) => handleNumberInput('forgemasterLevel', e)}
                    min="0" 
                    max="10" 
                    disabled={isCrafting}
                    class="very-narrow-input"
                >
            </div>
            
            <div class="button-group form-group">
                {#if !isCrafting}
                    <button class="primary-button" onclick={startCraftingClick}>Start Crafting</button>
                {:else}
                    <button class="primary-button" onclick={resetClick}>Start New</button>
                {/if}
            </div>
        </div>
    </div>
</div>
