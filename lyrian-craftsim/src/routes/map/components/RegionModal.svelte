<script lang="ts">
  import { uiStore, closeModal, createRegion } from '$lib/map/stores/uiStore';
  import { addRegion, updateRegion, removeRegion } from '$lib/map/stores/mapStore';
  import { v4 as uuidv4 } from 'uuid';
  
  // Form state
  let regionName = '';
  let regionColor = '#4CAF50'; // Default to green
  
  // Predefined color options
  const REGION_COLORS = [
    '#4CAF50', // Green
    '#2196F3', // Blue
    '#F44336', // Red
    '#9C27B0', // Purple
    '#FF9800', // Orange
    '#795548', // Brown
    '#607D8B', // Blue-gray
    '#E91E63', // Pink
    '#00BCD4', // Cyan
    '#FFEB3B'  // Yellow
  ];
  
  // Computed properties
  $: isEditing = $uiStore.modalParams?.regionId !== undefined;
  $: modalTitle = isEditing ? 'Edit Region' : 'Create New Region';
  $: regionId = $uiStore.modalParams?.regionId || '';
  $: selectedTiles = $uiStore.selectedTiles || [];
  
  // Initialize form when the modal is shown
  $: if ($uiStore.showModal && $uiStore.modalParams?.type === 'region') {
    if (isEditing) {
      // Find the region by ID
      const region = $uiStore.modalParams?.regionId ? 
        getRegionById($uiStore.modalParams.regionId) : null;
      
      if (region) {
        // Populate form with existing region data
        regionName = region.name;
        regionColor = region.color;
      }
    } else {
      // Default values for new region
      regionName = `Region ${Math.floor(Math.random() * 1000)}`;
      regionColor = REGION_COLORS[Math.floor(Math.random() * REGION_COLORS.length)];
    }
  }
  
  // Helper function to get a region by ID
  function getRegionById(id: string) {
    const regions = $mapData?.regions || [];
    return regions.find(r => r.id === id);
  }
  
  // Handle form submission
  function handleSubmit() {
    if (!regionName) return;
    
    if (isEditing && regionId) {
      // Update existing region
      updateRegion(regionId, {
        name: regionName,
        color: regionColor
      });
    } else {
      // Create a new region
      if (selectedTiles.length > 0) {
        createRegion(regionName, regionColor);
      } else {
        // If no tiles selected, create an empty region
        addRegion({
          id: uuidv4(),
          name: regionName,
          color: regionColor,
          tiles: []
        });
      }
    }
    
    // Close the modal
    closeModal();
  }
  
  // Handle region deletion
  function handleDelete() {
    if (isEditing && regionId) {
      removeRegion(regionId);
      closeModal();
    }
  }
  
  // Handle modal close
  function handleCancel() {
    closeModal();
  }
  
  // Import mapData from mapStore to access regions
  import { mapData } from '$lib/map/stores/mapStore';
</script>

<!-- Modal backdrop -->
{#if $uiStore.showModal && $uiStore.modalParams?.type === 'region'}
  <div class="modal-backdrop" on:click={handleCancel}>
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>{modalTitle}</h2>
        <button class="close-button" on:click={handleCancel}>×</button>
      </div>
      
      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
          <label for="region-name">Region Name</label>
          <input 
            type="text" 
            id="region-name" 
            bind:value={regionName} 
            required
            placeholder="Enter region name"
          />
        </div>
        
        <div class="form-group">
          <label>Region Color</label>
          <div class="color-input-row">
            <input type="color" bind:value={regionColor} />
            <span class="current-color" style:background-color={regionColor}></span>
          </div>
          
          <div class="color-grid">
            {#each REGION_COLORS as color}
              <button 
                type="button"
                class="color-button"
                class:active={regionColor === color}
                style:background-color={color}
                on:click={() => regionColor = color}
              ></button>
            {/each}
          </div>
        </div>
        
        {#if !isEditing}
          <div class="selected-tiles-info">
            {selectedTiles.length} tiles selected for this region
          </div>
        {/if}
        
        <div class="button-row">
          {#if isEditing}
            <button type="button" class="delete-button" on:click={handleDelete}>
              Delete Region
            </button>
          {/if}
          
          <button type="button" class="cancel-button" on:click={handleCancel}>
            Cancel
          </button>
          
          <button type="submit" class="submit-button" disabled={!isEditing && selectedTiles.length === 0}>
            {isEditing ? 'Update' : 'Create'}
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
  
  input[type="text"]:focus {
    outline: none;
    border-color: #666;
  }
  
  .color-input-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }
  
  input[type="color"] {
    width: 40px;
    height: 40px;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
  }
  
  .current-color {
    display: inline-block;
    width: 40px;
    height: 40px;
    border-radius: 0.25rem;
    border: 1px solid #444;
  }
  
  .color-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.5rem;
  }
  
  .color-button {
    height: 30px;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: transform 0.2s;
  }
  
  .color-button:hover {
    transform: scale(1.05);
  }
  
  .color-button.active {
    box-shadow: 0 0 0 3px #fff;
    transform: scale(1.1);
  }
  
  .selected-tiles-info {
    margin: 1rem 0;
    padding: 0.75rem;
    background-color: #333;
    border-radius: 0.25rem;
    font-size: 0.9rem;
    text-align: center;
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
  
  .submit-button:disabled {
    background-color: #888;
    cursor: not-allowed;
  }
  
  .cancel-button {
    background-color: #555;
    color: white;
  }
  
  .cancel-button:hover {
    background-color: #666;
  }
  
  .delete-button {
    background-color: #f44336;
    color: white;
    margin-right: auto;
  }
  
  .delete-button:hover {
    background-color: #d32f2f;
  }
</style>
