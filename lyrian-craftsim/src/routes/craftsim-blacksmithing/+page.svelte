<script>
    // Import components
    import {
        SetupForm,
        StatusDisplay,
        CraftingLog,
        ActionPanel,
        ButtonLegend
    } from '$lib/components/crafting';

// Import shared state and functions from centralized store
import {
    getState,
    getSelectedAlloy,
    getIsCrafting,
    getCraftResult,
    initializeState,
    resetSimulator,
    performAction
} from '$lib/data/crafting-state.svelte.js';

// Create reactive derivations using $derived
let state = $derived(getState());
let selectedAlloy = $derived(getSelectedAlloy());
let isCrafting = $derived(getIsCrafting());
let craftResult = $derived(getCraftResult());

    // Import CSS
    import '$lib/styles/crafting.css';
</script>

<main class="container">
    <div class="title-row">
        <h1>Lyrian Crafting Simulator - Blacksmithing</h1>
    </div>

    <div class="full-width">
        <SetupForm
            onStartCrafting={initializeState}
            onReset={resetSimulator}
        />
    </div>

    {#if isCrafting || craftResult}
        <div class="two-column-grid">
            <div class="left-column">
                <StatusDisplay
                    onReset={resetSimulator}
                />
                
                <CraftingLog />
            </div>
            
            <div class="right-column">
                <ActionPanel
                    onPerformAction={performAction}
                />
                
                <ButtonLegend />
            </div>
        </div>
    {/if}
</main>
