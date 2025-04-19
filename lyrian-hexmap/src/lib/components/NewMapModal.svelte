<script lang="ts">
  import { uiStore } from '$lib/stores/uiStore';
  import { mapStore } from '$lib/stores/mapStore';
  import { historyStore } from '$lib/stores/historyStore';
  
  let mapName = 'New Map';
  let mapWidth = 20;
  let mapHeight = 15;
  let error = '';
  
  // Reset form when modal opens
  $: if ($uiStore.isNewMapModalOpen) {
    resetForm();
  }
  
  // Reset form to default values
  function resetForm() {
    mapName = 'New Map';
    mapWidth = 20;
    mapHeight = 15;
    error = '';
  }
  
  // Create a new map with the specified dimensions
  function createNewMap() {
    // Validate inputs
    if (!mapName.trim()) {
      error = 'Map name cannot be empty';
      return;
    }
    
    if (mapWidth < 5 || mapWidth > 50) {
      error = 'Width must be between 5 and 50';
      return;
    }
    
    if (mapHeight < 5 || mapHeight > 50) {
      error = 'Height must be between 5 and 50';
      return;
    }
    
    // Create the new map
    try {
      mapStore.initMap(mapWidth, mapHeight, mapName);
      historyStore.clear();
      historyStore.pushState('New map created');
      uiStore.resetView();
      closeModal();
    } catch (err) {
      error = `Failed to create map: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }
  }
  
  // Close the modal
  function closeModal() {
    resetForm();
    uiStore.toggleNewMapModal();
  }
</script>

{#if $uiStore.isNewMapModalOpen}
  <div class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h2>Create New Map</h2>
        <button class="close-button" on:click={closeModal}>×</button>
      </div>
      
      <div class="modal-content">
        <div class="form-group">
          <label for="map-name">Map Name</label>
          <input 
            type="text" 
            id="map-name" 
            bind:value={mapName} 
            placeholder="Enter map name"
          />
        </div>
        
        <div class="form-group">
          <label for="map-width">Width (in hexes)</label>
          <input 
            type="number" 
            id="map-width" 
            bind:value={mapWidth} 
            min="5" 
            max="50"
          />
          <span class="hint">Recommended: 10-30</span>
        </div>
        
        <div class="form-group">
          <label for="map-height">Height (in hexes)</label>
          <input 
            type="number" 
            id="map-height" 
            bind:value={mapHeight} 
            min="5" 
            max="50"
          />
          <span class="hint">Recommended: 10-30</span>
        </div>
        
        {#if error}
          <div class="error-message">{error}</div>
        {/if}
        
        <div class="modal-actions">
          <button class="cancel" on:click={closeModal}>Cancel</button>
          <button class="create" on:click={createNewMap}>Create Map</button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal {
    background-color: white;
    border-radius: 6px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 500px;
    overflow: hidden;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #eee;
  }
  
  h2 {
    margin: 0;
    font-size: 20px;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    color: #888;
  }
  
  .close-button:hover {
    color: #333;
  }
  
  .modal-content {
    padding: 20px;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
  }
  
  input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 16px;
  }
  
  input[type="number"] {
    width: 100px;
  }
  
  .hint {
    display: block;
    font-size: 12px;
    color: #666;
    margin-top: 3px;
  }
  
  .error-message {
    color: #d32f2f;
    padding: 10px;
    border: 1px solid #ef9a9a;
    background-color: #ffebee;
    border-radius: 4px;
    margin-bottom: 15px;
  }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }
  
  button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }
  
  button.cancel {
    background-color: #f5f5f5;
    color: #333;
    border: 1px solid #ccc;
  }
  
  button.create {
    background-color: #0066cc;
    color: white;
  }
  
  button:hover {
    opacity: 0.9;
  }
</style>