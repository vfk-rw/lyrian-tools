<script>
    // @ts-nocheck
    // Import state getter from the shared module
    import { getState } from '$lib/data/crafting-state.svelte.js';
    
    // Create reactive derivation
    let state = $derived(getState());
</script>

<div class="section">
    <h2>Crafting Log</h2>
    <div class="log-box">
        {#each state.log as message}
            <div class="log-entry">
                {message}
            </div>
        {/each}
    </div>
</div>
