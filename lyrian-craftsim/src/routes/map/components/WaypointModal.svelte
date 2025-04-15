<script lang="ts">
  import { uiStore, closeModal } from '$lib/map/stores/uiStore';
  import { addWaypoint, updateWaypoint, routesData } from '$lib/map/stores/routeStore';
  import { onMount } from 'svelte';
  
  // Form state
  let waypointDate = '';
  let waypointNotes = '';
  let editingWaypoint = false;
  let editingWaypointId = '';
  let routeId = '';
  let hexQ = 0;
  let hexR = 0;
  
  // Format today's date as YYYY-MM-DD for the date input
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayFormatted = `${year}-${month}-${day}`;
  
  // Initialize form when modal opens
  onMount(() => {
    if ($uiStore.modalParams?.type === 'waypoint') {
      const params = $uiStore.modalParams;
      
      routeId = params.routeId;
      hexQ = params.q;
      hexR = params.r;
      
      if (params.waypointId) {
        // Editing existing waypoint
        editingWaypoint = true;
        editingWaypointId = params.waypointId;
        
        // Find the route and waypoint in the store
        const route = $routesData.routes.get(routeId);
        if (route) {
          const waypoint = route.waypoints.find(wp => wp.id === editingWaypointId);
          if (waypoint) {
            waypointDate = waypoint.date || '';
            waypointNotes = waypoint.notes || '';
          }
        }
      } else {
        // Creating new waypoint - set default date to today
        editingWaypoint = false;
        waypointDate = todayFormatted;
        
        // If there are already waypoints in the route, use the date of the last one
        const route = $routesData.routes.get(routeId);
        if (route && route.waypoints.length > 0) {
          const lastWaypoint = route.waypoints[route.waypoints.length - 1];
          if (lastWaypoint.date) {
            waypointDate = lastWaypoint.date;
          }
        }
      }
    }
  });
  
  // Handle form submission
  function handleSubmit() {
    if (editingWaypoint) {
      // Update existing waypoint
      updateWaypoint(routeId, editingWaypointId, {
        date: waypointDate || undefined,
        notes: waypointNotes || undefined
      });
    } else {
      // Create new waypoint
      addWaypoint(routeId, {
        q: hexQ,
        r: hexR,
        date: waypointDate || undefined,
        notes: waypointNotes || undefined
      });
    }
    
    // Close the modal
    closeModal();
  }
</script>

{#if $uiStore.showModal && $uiStore.modalParams?.type === 'waypoint'}
  <div class="modal-backdrop" on:click={closeModal} on:keydown={e => e.key === 'Escape' && closeModal()} role="dialog" aria-modal="true">
    <div class="modal-content" on:click|stopPropagation role="document">
      <div class="modal-header">
        <h2>{editingWaypoint ? 'Edit Waypoint' : 'New Waypoint'}</h2>
        <button class="close-button" on:click={closeModal}>×</button>
      </div>
      
      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
          <label for="waypoint-date">Date (optional)</label>
          <input 
            type="date" 
            id="waypoint-date" 
            bind:value={waypointDate} 
            autofocus
          />
          <p class="helper-text">Set date for this waypoint in your journey</p>
        </div>
        
        <div class="form-group">
          <label for="waypoint-notes">Notes (optional)</label>
          <textarea 
            id="waypoint-notes" 
            bind:value={waypointNotes} 
            placeholder="Add any details about this waypoint..."
            rows="3"
          ></textarea>
        </div>
        
        <div class="coordinates">
          <div class="coord-label">Location: </div>
          <div class="coord-value">q:{hexQ}, r:{hexR}</div>
        </div>
        
        <div class="button-row">
          <button type="button" class="cancel-button" on:click={closeModal}>
            Cancel
          </button>
          <button type="submit" class="submit-button">
            {editingWaypoint ? 'Update' : 'Add'} Waypoint
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
  
  input[type="date"], textarea {
    width: 100%;
    padding: 0.75rem;
    background-color: #333;
    border: 1px solid #444;
    border-radius: 0.25rem;
    color: white;
    font-size: 1rem;
    font-family: inherit;
  }
  
  input:focus, textarea:focus {
    outline: none;
    border-color: #666;
  }
  
  .helper-text {
    font-size: 0.8rem;
    color: #888;
    margin-top: 0.25rem;
    margin-bottom: 0;
  }
  
  .coordinates {
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
    background-color: rgba(0, 0, 0, 0.2);
    padding: 0.5rem;
    border-radius: 4px;
  }
  
  .coord-label {
    font-weight: 500;
    color: #aaa;
  }
  
  .coord-value {
    color: white;
    font-family: monospace;
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
