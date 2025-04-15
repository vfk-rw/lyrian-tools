<script lang="ts">
  import { uiStore, closeModal, showModal, type RouteModalParams } from '$lib/map/stores/uiStore';
  import { addRoute, updateRoute, routesData, addWaypoint } from '$lib/map/stores/routeStore';
  import { onMount } from 'svelte';
  import { getPlayerNames, getAdventurerNames } from '$lib/map/data/censusParser';
  import '$lib/styles/modal.css';
  
  // Form state
  let routeName = '';
  let routeColor = '#ff0000';
  let editingRoute = false;
  let editingRouteId = '';
  let participants: string[] = [];
  let gm: string | undefined = undefined;
  
  // UI state
  let searchTerm = '';
  let filteredAdventurers: string[] = [];
  
  // Census data
  let playerNames: string[] = [];
  let adventurerNames: string[] = [];
  let loadingCensus = true;
  
  // Preset colors for easy selection
  const presetColors = [
    '#ff0000', // Red
    '#00ff00', // Green
    '#0000ff', // Blue
    '#ffff00', // Yellow
    '#ff00ff', // Magenta
    '#00ffff', // Cyan
    '#ff8800', // Orange
    '#8800ff', // Purple
    '#008888', // Teal
    '#880000'  // Dark Red
  ];
  
  // Load census data
  async function loadCensusData() {
    try {
      loadingCensus = true;
      playerNames = await getPlayerNames();
      adventurerNames = await getAdventurerNames();
      updateFilteredAdventurers();
    } catch (error) {
      console.error('Error loading census data:', error);
    } finally {
      loadingCensus = false;
    }
  }
  
  // Filter adventurers based on search term
  function updateFilteredAdventurers() {
    if (!searchTerm) {
      filteredAdventurers = [...adventurerNames];
      return;
    }
    
    const term = searchTerm.toLowerCase();
    filteredAdventurers = adventurerNames.filter(name => 
      name.toLowerCase().includes(term)
    );
  }
  
  // Watch for search term changes
  $: if (searchTerm !== undefined) {
    updateFilteredAdventurers();
  }
  
  // Add a participant
  function addParticipant(participant: string) {
    if (participants.includes(participant)) {
      return; // Already added
    }
    
    // Only allow up to 5 participants
    if (participants.length < 5) {
      participants = [...participants, participant];
    } else {
      alert('Maximum of 5 participants allowed');
    }
  }
  
  // Remove a participant
  function removeParticipant(participant: string) {
    participants = participants.filter(p => p !== participant);
  }
  
  // Initialize form when modal opens
  onMount(async () => {
    // Load census data
    await loadCensusData();
    
    if ($uiStore.modalParams?.type === 'route') {
      const params = $uiStore.modalParams;
      
      if (params.routeId) {
        // Editing existing route
        editingRoute = true;
        editingRouteId = params.routeId;
        
        // Find the route in the store
        const route = $routesData.routes.get(params.routeId);
        if (route) {
          routeName = route.name;
          routeColor = route.color;
          participants = [...(route.participants || [])];
          gm = route.gm;
        }
      } else {
        // Creating new route
        editingRoute = false;
        routeName = `Route ${$routesData.routes.size + 1}`;
        routeColor = presetColors[Math.floor(Math.random() * presetColors.length)];
        participants = [];
        gm = undefined;
      }
    }
  });
  
  // Handle form submission
  function handleSubmit() {
    console.group('[DEBUG] RouteModal.handleSubmit');
    console.log(`Route name: ${routeName}, color: ${routeColor}`);
    console.log(`Editing: ${editingRoute}, ID: ${editingRouteId}`);
    console.log(`Participants: ${participants.join(', ')}, GM: ${gm || 'none'}`);
    console.log(`Has pending waypoint: ${$uiStore.modalParams?.type === 'route' && ($uiStore.modalParams as RouteModalParams).pendingWaypoint ? 'yes' : 'no'}`);
    
    if (!routeName.trim()) {
      alert('Please enter a route name');
      console.warn('No route name provided');
      console.groupEnd();
      return;
    }
    
    if (editingRoute) {
      // Update existing route
      updateRoute(editingRouteId, {
        name: routeName,
        color: routeColor,
        participants,
        gm
      });
      console.log(`Updated route ${editingRouteId}`);
    } else {
      // Create new route
      const newRouteId = addRoute({
        name: routeName,
        color: routeColor,
        participants,
        gm
      });
      
      console.log(`Created new route with ID: ${newRouteId}`);
      
      // Set the new route to edit mode
      updateRoute(newRouteId, { editable: true });
      
      // Check if this was created for a pending waypoint
      if ($uiStore.modalParams?.type === 'route' && 
          ($uiStore.modalParams as RouteModalParams).pendingWaypoint && 
          $uiStore.pendingWaypointQ !== undefined && 
          $uiStore.pendingWaypointR !== undefined) {
        
        console.log(`Adding pending waypoint at q=${$uiStore.pendingWaypointQ}, r=${$uiStore.pendingWaypointR}`);
        
        // Add the pending waypoint to this new route
        const waypointId = addWaypoint(newRouteId, {
          q: $uiStore.pendingWaypointQ,
          r: $uiStore.pendingWaypointR
        });
        
        console.log(`Added pending waypoint with ID: ${waypointId}`);
        
        // Close this modal first
        closeModal();
        
        // Then immediately open the waypoint modal for the new waypoint
        setTimeout(() => {
          showModal({
            type: 'waypoint',
            routeId: newRouteId,
            q: $uiStore.pendingWaypointQ!,
            r: $uiStore.pendingWaypointR!
          });
        }, 100);
        
        // Clear the pending waypoint data
        uiStore.set({
          ...$uiStore,
          pendingWaypointQ: undefined,
          pendingWaypointR: undefined
        });
        
        console.log('Scheduled waypoint modal to open');
        console.groupEnd();
        return;
      }
    }
    
    // Close the modal
    closeModal();
    console.groupEnd();
  }
  
  // Handle color selection
  function selectColor(color: string) {
    routeColor = color;
  }
</script>

{#if $uiStore.showModal && $uiStore.modalParams?.type === 'route'}
  <div class="modal-backdrop" on:click={closeModal} on:keydown={e => e.key === 'Escape' && closeModal()} role="dialog" aria-modal="true">
    <div class="modal-content" on:click|stopPropagation role="document">
      <div class="modal-header">
        <h2>{editingRoute ? 'Edit Route' : 'New Route'}</h2>
        <button class="close-button" on:click={closeModal}>×</button>
      </div>
      
      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
          <label for="route-name">Route Name</label>
          <input 
            type="text" 
            id="route-name" 
            bind:value={routeName} 
            placeholder="Enter route name"
            class="dark-input"
            autofocus
          />
        </div>
        
        <div class="form-group">
          <label>Route Color</label>
          <div class="color-picker">
            <input 
              type="color" 
              bind:value={routeColor} 
              class="color-input"
            />
            <div class="color-presets">
              {#each presetColors as color}
                <button 
                  type="button"
                  class="color-preset" 
                  style="background-color: {color}" 
                  on:click={() => selectColor(color)}
                  class:selected={routeColor === color}
                ></button>
              {/each}
            </div>
          </div>
        </div>
        
        <!-- Participants Selection -->
        <div class="form-group participants-group">
          <div class="participants-header">
            <label>Participants (max 5 adventurers)</label>
            <div class="participant-count">{participants.length}/5</div>
          </div>
          
          <!-- Search box for filtering -->
          <div class="search-container">
            <input 
              type="text" 
              placeholder="Search adventurers..." 
              bind:value={searchTerm}
              class="search-input"
            />
          </div>
          
          <!-- Selected participants list -->
          <div class="selected-participants">
            <div class="selected-header">Selected Participants:</div>
            {#if participants.length === 0}
              <div class="empty-selection">No participants selected</div>
            {:else}
              <div class="selected-list">
                {#each participants as participant}
                  <div class="selected-participant">
                    <span class="participant-name">{participant}</span>
                    <button 
                      type="button" 
                      class="remove-button" 
                      on:click={() => removeParticipant(participant)}
                      title="Remove participant"
                    >×</button>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
          
          <!-- Available adventurers -->
          {#if loadingCensus}
            <div class="loading-indicator">Loading census data...</div>
          {:else}
            <div class="available-header">Available Adventurers:</div>
            <div class="available-participants">
              {#if filteredAdventurers.length > 0}
                {#each filteredAdventurers as adventurer}
                  <div class="adventurer-item" class:disabled={participants.includes(adventurer)}>
                    <span class="adventurer-name">{adventurer}</span>
                    <button 
                      type="button" 
                      class="add-button"
                      on:click={() => addParticipant(adventurer)}
                      disabled={participants.includes(adventurer) || participants.length >= 5}
                    >+</button>
                  </div>
                {/each}
              {:else}
                <div class="empty-state">
                  {searchTerm ? 'No matching adventurers found' : 'No adventurers available'}
                </div>
              {/if}
            </div>
          {/if}
        </div>
        
        <!-- GM Selection -->
        <div class="form-group">
          <label for="gm-select">Game Master (optional)</label>
          <select id="gm-select" bind:value={gm}>
            <option value={undefined}>-- No GM --</option>
            {#each playerNames as player}
              <option value={player}>{player}</option>
            {/each}
          </select>
        </div>
        
        <div class="button-row">
          <button type="button" class="cancel-button" on:click={closeModal}>
            Cancel
          </button>
          <button type="submit" class="submit-button">
            {editingRoute ? 'Update' : 'Create'} Route
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  /* Make modal wider to fit participant selection better but ensure it adapts to screen size */
  .modal-content {
    max-width: 580px; /* Slightly reduced to avoid cutoff */
    width: 85vw; /* Use viewport width to ensure it scales with screen size */
    margin: 0 2vw; /* Add some margin to prevent cutoff on edges */
  }
  
  /* Route-specific modifications */
  .color-input {
    width: 50px;
    height: 50px;
    border-radius: 4px;
  }
  
  /* Participant selection styles */
  .participants-group {
    margin-bottom: 1.5rem;
  }
  
  .participants-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .participant-count {
    font-size: 0.9rem;
    font-weight: 600;
    color: #aaa;
    background-color: rgba(255, 255, 255, 0.1);
    padding: 0.2rem 0.5rem;
    border-radius: 10px;
  }
  
  .search-container {
    margin-bottom: 0.75rem;
  }
  
  .search-input {
    width: 100%;
    background-color: #333;
    color: #fff;
    border: 1px solid #555;
    border-radius: 4px;
    padding: 0.5rem;
    font-size: 0.9rem;
  }
  
  .search-input::placeholder {
    color: #999;
  }
  
  .selected-participants, 
  .available-participants {
    background-color: #2a2a2a;
    border: 1px solid #444;
    border-radius: 4px;
    padding: 0.5rem;
    margin-bottom: 0.75rem;
  }
  
  .selected-header,
  .available-header {
    font-size: 0.9rem;
    color: #aaa;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  
  .empty-selection,
  .empty-state {
    padding: 0.5rem;
    color: #777;
    font-style: italic;
    text-align: center;
    font-size: 0.9rem;
  }
  
  .selected-list {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  
  .selected-participant {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #444;
    padding: 0.4rem 0.6rem;
    border-radius: 4px;
    width: 100%;
    box-sizing: border-box;
  }
  
  .remove-button {
    background-color: #555;
    color: #fff;
    border: none;
    border-radius: 50%;
    width: 22px;
    height: 22px;
    font-size: 1rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  
  .remove-button:hover {
    background-color: #f44336;
  }
  
  .available-participants {
    max-height: 200px;
    overflow-y: auto;
  }
  
  .adventurer-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0.6rem;
    border-radius: 4px;
    margin-bottom: 0.3rem;
    width: 100%;
    box-sizing: border-box;
  }
  
  .adventurer-item:hover {
    background-color: #333;
  }
  
  .adventurer-item.disabled {
    opacity: 0.5;
  }
  
  .add-button {
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 50%;
    width: 22px;
    height: 22px;
    font-size: 1.1rem;
    font-weight: bold;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  
  .add-button:hover:not(:disabled) {
    background-color: #45a049;
  }
  
  .add-button:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
  
  .loading-indicator {
    padding: 0.5rem;
    color: #aaa;
    font-style: italic;
    text-align: center;
  }
  
  /* GM selection styles */
  #gm-select {
    width: 100%;
    padding: 0.5rem;
    border-radius: 4px;
    background-color: #333;
    color: #fff;
    border: 1px solid #555;
    margin-top: 0.25rem;
  }
</style>
