<script lang="ts">
  import { uiStore } from '$lib/stores/uiStore';
  import { mapStore } from '$lib/stores/mapStore';
  import { historyStore } from '$lib/stores/historyStore';
  
  let name = '';
  let description = '';
  let error = '';
  
  // Get the selected region data when the modal opens
  $: if ($uiStore.isRegionEditModalOpen && $mapStore.selectedRegion) {
    const region = $mapStore.regions.get($mapStore.selectedRegion);
    if (region) {
      name = region.name;
      description = region.description;
    }
  }
  
  // Save region changes
  function saveRegion() {
    // Validate inputs
    if (!name.trim()) {
      error = 'Region name cannot be empty';
      return;
    }
    
    if ($mapStore.selectedRegion) {
      mapStore.updateRegion($mapStore.selectedRegion, {
        name,
        description
      });
      historyStore.pushState('Update region');
      closeModal();
    }
  }
  
  // Delete the selected region
  function deleteRegion() {
    if ($mapStore.selectedRegion) {
      if (confirm('Are you sure you want to delete this region?')) {
        mapStore.deleteRegion($mapStore.selectedRegion);
        historyStore.pushState('Delete region');
        closeModal();
      }
    }
  }
  
  // Create a new region from the currently selected tiles
  function createRegionFromSelection() {
    const selectedTileKeys = [...$mapStore.selectedTiles];
    
    if (selectedTileKeys.length === 0) {
      error = 'No tiles selected. Select tiles to create a region.';
      return;
    }
    
    // Validate region name
    if (!name.trim()) {
      error = 'Region name cannot be empty';
      return;
    }
    
    // Convert selected tile keys to coordinates
    const hexes = selectedTileKeys.map(key => {
      const [q, r] = key.split(',').map(Number);
      return { q, r };
    });
    
    // Create the region
    mapStore.addRegion(name, description, hexes);
    historyStore.pushState('Create region');
    closeModal();
  }
  
  // Close the modal
  function closeModal() {
    name = '';
    description = '';
    error = '';
    uiStore.toggleRegionEditModal();
  }
  
  // Determine if we're editing an existing region or creating a new one
  $: isEditing = $uiStore.isRegionEditModalOpen && $mapStore.selectedRegion !== null;
</script>

{#if $uiStore.isRegionEditModalOpen}
  <div class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h2>{isEditing ? 'Edit Region' : 'Create Region'}</h2>
        <button class="close-button" on:click={closeModal}>×</button>
      </div>
      
      <div class="modal-content">
        <div class="form-group">
          <label for="region-name">Name</label>
          <input 
            type="text" 
            id="region-name" 
            bind:value={name} 
            placeholder="Enter region name"
          />
        </div>
        
        <div class="form-group">
          <label for="region-description">Description</label>
          <textarea 
            id="region-description" 
            bind:value={description} 
            placeholder="Enter region description"
            rows="5"
          ></textarea>
        </div>
        
        {#if !isEditing}
          <div class="selection-info">
            <p>Selected Tiles: {$mapStore.selectedTiles.size}</p>
            <p class="hint">Select tiles on the map to create a region.</p>
          </div>
        {/if}
        
        {#if error}
          <div class="error-message">{error}</div>
        {/if}
        
        <div class="modal-actions">
          {#if isEditing}
            <button class="delete" on:click={deleteRegion}>Delete</button>
            <div class="spacer"></div>
            <button class="cancel" on:click={closeModal}>Cancel</button>
            <button class="save" on:click={saveRegion}>Save</button>
          {:else}
            <div></div>
            <div class="spacer"></div>
            <button class="cancel" on:click={closeModal}>Cancel</button>
            <button class="save" on:click={createRegionFromSelection}>Create</button>
          {/if}
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
  
  input, textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 16px;
  }
  
  textarea {
    resize: vertical;
  }
  
  .selection-info {
    margin: 15px 0;
    padding: 10px;
    background-color: #f5f5f5;
    border-radius: 4px;
  }
  
  .selection-info p {
    margin: 5px 0;
  }
  
  .hint {
    font-size: 12px;
    color: #666;
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
    justify-content: space-between;
    margin-top: 20px;
  }
  
  .spacer {
    flex: 1;
  }
  
  button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    margin-left: 10px;
  }
  
  button.cancel {
    background-color: #f5f5f5;
    color: #333;
    border: 1px solid #ccc;
  }
  
  button.save {
    background-color: #0066cc;
    color: white;
  }
  
  button.delete {
    background-color: #d32f2f;
    color: white;
    margin-left: 0;
  }
  
  button:hover {
    opacity: 0.9;
  }
</style>