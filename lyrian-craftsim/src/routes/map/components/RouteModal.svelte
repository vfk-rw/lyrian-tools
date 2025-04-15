<script lang="ts">
  import { uiStore, closeModal, showModal, type RouteModalParams } from '$lib/map/stores/uiStore';
  import { addRoute, updateRoute, routesData, addWaypoint } from '$lib/map/stores/routeStore';
  import { onMount } from 'svelte';
  
  // Form state
  let routeName = '';
  let routeColor = '#ff0000';
  let editingRoute = false;
  let editingRouteId = '';
  
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
  
  // Initialize form when modal opens
  onMount(() => {
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
        }
      } else {
        // Creating new route
        editingRoute = false;
        routeName = `Route ${$routesData.routes.size + 1}`;
        routeColor = presetColors[Math.floor(Math.random() * presetColors.length)];
      }
    }
  });
  
  // Handle form submission
  function handleSubmit() {
    console.group('[DEBUG] RouteModal.handleSubmit');
    console.log(`Route name: ${routeName}, color: ${routeColor}`);
    console.log(`Editing: ${editingRoute}, ID: ${editingRouteId}`);
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
        color: routeColor
      });
      console.log(`Updated route ${editingRouteId}`);
    } else {
      // Create new route
      const newRouteId = addRoute({
        name: routeName,
        color: routeColor
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
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-content {
    background-color: #2a2a2a;
    color: white;
    border-radius: 0.5rem;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #444;
  }
  
  .modal-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 500;
  }
  
  .close-button {
    background: none;
    border: none;
    color: #aaa;
    font-size: 1.5rem;
    cursor: pointer;
  }
  
  .close-button:hover {
    color: white;
  }
  
  form {
    padding: 1rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    color: #ccc;
  }
  
  input[type="text"] {
    width: 100%;
    padding: 0.75rem;
    background-color: #333;
    border: 1px solid #444;
    border-radius: 0.25rem;
    color: white;
    font-size: 1rem;
  }
  
  input:focus {
    outline: none;
    border-color: #666;
  }
  
  .color-picker {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .color-input {
    width: 50px;
    height: 50px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: none;
    cursor: pointer;
  }
  
  .color-presets {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .color-preset {
    width: 25px;
    height: 25px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform 0.1s;
  }
  
  .color-preset:hover {
    transform: scale(1.1);
  }
  
  .color-preset.selected {
    border-color: white;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
  }
  
  .button-row {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }
  
  button {
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 0.25rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .submit-button {
    background-color: #4CAF50;
    color: white;
  }
  
  .submit-button:hover {
    background-color: #3e8e41;
  }
  
  .cancel-button {
    background-color: #555;
    color: white;
  }
  
  .cancel-button:hover {
    background-color: #666;
  }
</style>
