<script lang="ts">
import {
  initialCraftingState,
  baseMaterials,
  specialMaterials,
  craftingActions
} from '$lib/data';
import type { CraftingState, CraftingAction, SpecialMaterial } from '$lib/types';
import { onMount } from 'svelte';
import { tick } from 'svelte'; // Import tick

// --- State ---
let state: CraftingState = { ...initialCraftingState }; // Deep copy for reset
let selectedAlloy: string = Object.keys(specialMaterials)[0]; // Default to first alloy
let isCrafting: boolean = false; // Track if crafting is active
let craftResult: 'Success' | 'Failure' | null = null;

let logBoxElement: HTMLDivElement; // For scrolling

// --- Computed Values ---
$: availableActions = Object.values(craftingActions).filter((action) => {
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
});

// --- Functions ---

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
  // Keep user inputs, reset the rest
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

function performAction(actionId: string) {
  if (!isCrafting) return;

  const action = craftingActions[actionId];
  if (!action) return;

  let newState: CraftingState;

  // Check level requirements first
  const hasLevel = action.className === null || 
    (action.className === 'blacksmith' && state.blacksmithLevel >= action.classLevel) ||
    (action.className === 'forgemaster' && state.forgemasterLevel >= action.classLevel);

  if (!hasLevel) {
    const className = action.className === 'blacksmith' ? 'Blacksmith' : 'Forgemaster';
    newState = { ...state, log: [...state.log, `Error: Requires ${className} Level ${action.classLevel}`] };
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
      const effectFn = action.effect as (s: CraftingState, alloyId?: string, alloyData?: SpecialMaterial) => CraftingState;
      newState = effectFn(state, selectedAlloy, alloyData);
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

  // Scroll log after state update
  tick().then(scrollToLogBottom);
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
  // Ensure dice are 0 if crafting ended prematurely (e.g., Standard Finish)
  state = { ...state, diceRemaining: 0 };
}

// Function to scroll log box
function scrollToLogBottom() {
  if (logBoxElement) {
    logBoxElement.scrollTop = logBoxElement.scrollHeight;
  }
}

// Initialize on mount with default values
onMount(() => {
  // No automatic start, wait for user input and "Start Crafting" button
});

</script>

<main class="container">
  <div class="title-row">
    <h1>Lyrian Crafting Simulator - Blacksmithing</h1>
    <a href="https://www.github.com/vfk-rw/lyrian-tools" target="_blank" class="github-link">GitHub</a>
  </div>

  <div class="section">
    <h2>Setup</h2>
    <div class="compact-form-grid">
      <div class="form-row">
        <div class="form-group">
          <label for="itemValue">Value:</label>
          <input 
            id="itemValue" 
            type="number" 
            bind:value={state.itemValue} 
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
            bind:value={state.craftingHP} 
            min="1" 
            disabled={isCrafting}
            class="narrow-input"
          >
        </div>
        <div class="form-group material-group">
          <label for="baseMaterial">Material:</label>
          <select 
            id="baseMaterial" 
            bind:value={state.baseMaterial} 
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
            bind:value={state.craftingSkill} 
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
            bind:value={state.expertise} 
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
            bind:value={state.blacksmithLevel} 
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
            bind:value={state.forgemasterLevel} 
            min="0" 
            max="10" 
            disabled={isCrafting}
            class="very-narrow-input"
          >
        </div>
        
        <div class="button-group form-group">
          {#if !isCrafting}
            <button class="primary-button" on:click={initializeState}>Start Crafting</button>
          {:else}
            <button class="primary-button" on:click={resetSimulator}>Start New</button>
          {/if}
        </div>
      </div>
    </div>
  </div>

  {#if isCrafting || craftResult}

    <div class="section">
      <div class="status-header">
        <h2>Current Status</h2>
        {#if isCrafting}
          <button class="danger-button reset-button" on:click={resetSimulator}>Reset</button>
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

    <div class="section">
      <h2>Log</h2>
      <div 
        class="log-box"
        bind:this={logBoxElement}
      >
        {#each state.log as entry, i (i)}
          <p class="log-entry {entry.startsWith('Error:') ? 'error' : entry.includes('SUCCESS!') ? 'success' : entry.includes('FAILURE!') ? 'failure' : ''}">
            {entry}
          </p>
        {/each}
      </div>
    </div>

    <div class="section">
      <h2>Actions</h2>
      <div class="action-grid">
        {#each Object.values(craftingActions) as action (action.id)}
          {@const isAlloyAction = action.id === 'weapon-alloy'}
          {@const hasRequiredLevel = action.className === null || 
            (action.className === 'blacksmith' && state.blacksmithLevel >= action.classLevel) ||
            (action.className === 'forgemaster' && state.forgemasterLevel >= action.classLevel)}
          {@const hasPoints = isAlloyAction 
            ? state.craftingPoints >= specialMaterials[selectedAlloy]?.point_cost
            : action.pointsCost === 0 || state.craftingPoints >= action.pointsCost}
          {@const hasDiceAndPrereqs = state.diceRemaining >= action.diceCost && 
            (!action.requiresPrerequisite || (action.prerequisite && action.prerequisite(state)))}
          {@const isUsed = !action.isRapid && action.id !== 'basic-craft' && state.usedActions.includes(action.id)}
          {@const available = hasRequiredLevel && hasPoints && hasDiceAndPrereqs && !isUsed}
          
          <div class="action-item">
            <button
              class={available ? "primary-button" : isUsed ? "danger-button" : hasRequiredLevel ? "warning-button" : "disabled-button"}
              on:click={() => performAction(action.id)}
              disabled={!isCrafting || (!hasRequiredLevel && !hasPoints && !hasDiceAndPrereqs) || isUsed}
              title={`${action.description}\nCost: ${isAlloyAction ? `${specialMaterials[selectedAlloy]?.point_cost ?? '?'} Points (${selectedAlloy})` : action.costText}${action.className ? `\nRequires: ${action.className} Lvl ${action.classLevel}` : ''}${action.requiresPrerequisite ? 
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
              {action.name} ({isAlloyAction ? `${specialMaterials[selectedAlloy]?.point_cost ?? 'X'} Points` : action.costText})
            </button>
            {#if isAlloyAction}
              <select 
                class="alloy-select" 
                bind:value={selectedAlloy} 
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

    <div class="section">
      <h2>Button Colors</h2>
      <div class="legend-grid">
        <div class="legend-item">
          <div class="color-sample primary-bg"></div>
          <span>Available to use</span>
        </div>
        <div class="legend-item">
          <div class="color-sample danger-bg"></div>
          <span>Already used (non-rapid skills)</span>
        </div>
        <div class="legend-item">
          <div class="color-sample warning-bg"></div>
          <span>Has level but missing points/dice</span>
        </div>
        <div class="legend-item">
          <div class="color-sample disabled-bg"></div>
          <span>Missing required class level</span>
        </div>
      </div>
    </div>
  {/if}
</main>

<style>
  .container {
    width: 95%;
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }
  
  .github-link {
    font-size: 1rem;
    color: #3b82f6;
    text-decoration: none;
    border: 1px solid #3b82f6;
    border-radius: 0.25rem;
    padding: 0.25rem 0.75rem;
  }
  
  .github-link:hover {
    background-color: #3b82f6;
    color: white;
  }
  
  h1 {
    font-size: 2rem;
    font-weight: bold;
    margin: 0;
  }
  
  h2 {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 1rem;
  }
  
  .section {
    margin-bottom: 1.5rem;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    background-color: white;
  }
  
  .compact-form-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .form-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: flex-end;
  }
  
  .form-group {
    margin-bottom: 0;
    flex: 0 0 auto;
  }
  
  .material-group {
    flex-grow: 1;
    min-width: 200px;
  }
  
  .material-select {
    width: 100%;
  }
  
  .form-group label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.25rem;
    font-size: 0.875rem;
  }
  
  input, select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 0.25rem;
  }
  
  button {
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .primary-button {
    background-color: #3b82f6;
    color: white;
    border: none;
  }
  
  .primary-button:hover:not(:disabled) {
    background-color: #2563eb;
  }
  
  .danger-button {
    background-color: #ef4444;
    color: white;
    border: none;
  }
  
  .danger-button:hover:not(:disabled) {
    background-color: #dc2626;
  }
  
  .warning-button {
    background-color: #f59e0b;
    color: white;
    border: none;
  }
  
  .warning-button:hover:not(:disabled) {
    background-color: #d97706;
  }
  
  .disabled-button {
    background-color: #e5e7eb;
    color: #374151;
    border: 1px solid #d1d5db;
  }
  
  .button-group {
    display: flex;
    justify-content: flex-end;
    margin-top: 0;
  }
  
  .legend-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 0.5rem;
  }
  
  @media (min-width: 640px) {
    .legend-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .color-sample {
    width: 1rem;
    height: 1rem;
    border-radius: 0.25rem;
  }
  
  .primary-bg {
    background-color: #3b82f6;
  }
  
  .danger-bg {
    background-color: #ef4444;
  }
  
  .warning-bg {
    background-color: #f59e0b;
  }
  
  .disabled-bg {
    background-color: #e5e7eb;
  }
  
  .status-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .reset-button {
    padding: 0.25rem 0.75rem;
    font-size: 0.875rem;
  }
  
  .status-row {
    display: flex;
    gap: 1rem;
  }
  
  .status-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 1rem;
  }
  
  @media (min-width: 640px) {
    .status-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  .status-item {
    padding: 0.75rem;
    background-color: #f3f4f6;
    border-radius: 0.5rem;
  }
  
  .status-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #4b5563;
  }
  
  .status-value {
    font-size: 1.25rem;
    color: #1f2937;
  }
  
  .result-box {
    margin-top: 1.5rem;
    padding: 1rem;
    text-align: center;
    border-radius: 0.5rem;
  }
  
  .result-box.success {
    background-color: #d1fae5;
    color: #065f46;
  }
  
  .result-box.failure {
    background-color: #fee2e2;
    color: #b91c1c;
  }
  
  .result-text {
    font-size: 1.25rem;
    font-weight: bold;
  }
  
  .action-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 1rem;
  }
  
  @media (min-width: 640px) {
    .action-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (min-width: 1024px) {
    .action-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  
  .action-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .action-item button {
    width: 100%;
  }
  
  .alloy-select {
    width: 100%;
  }
  
  .prerequisite-ready {
    border: 2px solid #10b981;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }
  
  .log-box {
    height: 200px;
    overflow-y: auto;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background-color: #f9fafb;
  }
  
  .log-entry {
    padding-bottom: 0.5rem;
    margin-bottom: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
    font-size: 0.875rem;
  }
  
  .log-entry:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
  
  .log-entry.error {
    color: #ef4444;
    font-weight: 500;
  }
  
  .log-entry.success {
    color: #10b981;
    font-weight: 500;
  }
  
  .log-entry.failure {
    color: #ef4444;
    font-weight: 500;
  }
  
  /* Input width adjustments */
  .narrow-input {
    width: 80px;
    max-width: 150px;
  }
  
  .very-narrow-input {
    width: 60px;
    max-width: 80px;
  }
  
  /* Status item width adjustment */
  .narrow-status {
    max-width: 180px;
  }
  
  /* Dark theme styles */
  :global(.dark-theme) .section {
    background-color: #1f2937;
    border-color: #374151;
  }
  
  :global(.dark-theme) h1,
  :global(.dark-theme) h2 {
    color: #f9fafb;
  }
  
  :global(.dark-theme) .status-item {
    background-color: #374151;
  }
  
  :global(.dark-theme) .status-label {
    color: #d1d5db;
  }
  
  :global(.dark-theme) .status-value {
    color: #f9fafb;
  }
  
  :global(.dark-theme) .log-box {
    background-color: #111827;
    border-color: #374151;
  }
  
  :global(.dark-theme) .log-entry {
    border-color: #374151;
  }
  
  :global(.dark-theme) .disabled-button {
    background-color: #374151;
    color: #d1d5db;
    border-color: #4b5563;
  }
  
  :global(.dark-theme) input,
  :global(.dark-theme) select {
    background-color: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }
</style>
