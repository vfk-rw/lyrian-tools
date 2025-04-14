<script lang="ts">
  import { uiState } from '$lib/map/stores/uiStore';
  import { mapData } from '$lib/map/stores/mapStore';
  import type { Region } from '$lib/map/stores/mapStore';
  
  // Simple ID generator function
  function generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
  
  // Region form fields
  let name = '';
  let color = '#ff9800';  // Default color - orange
  
  // Color options for regions
  const colorOptions = [
    { id: 'red', value: '#e74c3c', name: 'Red' },
    { id: 'orange', value: '#ff9800', name: 'Orange' },
    { id: 'yellow', value: '#f1c40f', name: 'Yellow' },
    { id: 'green', value: '#2ecc71', name: 'Green' },
    { id: 'blue', value: '#3498db', name: 'Blue' },
    { id: 'purple', value: '#9b59b6', name: 'Purple' },
    { id: 'pink', value: '#e84393', name: 'Pink' },
    { id: 'teal', value: '#1abc9c', name: 'Teal' }
  ];
  
  // When the modal is shown, initialize form fields
  $effect(() => {
    if (!$uiState.showRegionModal) return;
    
    // If editing an existing region, fill the form with its data
    if ($uiState.editingRegion) {
      const region = $mapData.regions.find(r => r.id === $uiState.editingRegion);
      if (region) {
        name = region.name;
        color = region.color;
      }
    } else {
      // Reset form for new region
      name = '';
      color = '#ff9800';
    }
  });
  
  // Submit handler
  function handleSubmit() {
    // Validation
    if (!name.trim()) {
      alert('Please enter a name for the region');
      return;
    }
    
    if ($uiState.selectedTiles.size === 0 && !$uiState.editingRegion) {
      alert('Please select at least one tile for the region');
      return;
    }
    
    // Convert selected tiles set to array of coordinates
    const selectedTileCoords = Array.from($uiState.selectedTiles);
    
    // Update the regions array
    if ($uiState.editingRegion) {
      // Editing an existing region
      $mapData.regions = $mapData.regions.map(region => 
        region.id === $uiState.editingRegion
          ? { 
              ...region, 
              name, 
              color,
              // Merge existing tiles with newly selected ones if any
              tiles: $uiState.selectedTiles.size > 0 
                ? [...selectedTileCoords]
                : region.tiles
            }
          : region
      );
    } else {
      // Creating a new region
      $mapData.regions = [
        ...$mapData.regions,
        {
          id: generateId(),
          name,
          color,
          tiles: selectedTileCoords
        }
      ];
    }
    
    // Close the modal and clear selections
    closeModal();
  }
  
  // Delete handler
  function handleDelete() {
    if (!$uiState.editingRegion) {
      return;
    }
    
    if (!confirm('Are you sure you want to delete this region?')) {
      return;
    }
    
    // Remove the region
    $mapData.regions = $mapData.regions.filter(
      region => region.id !== $uiState.editingRegion
    );
    
    // Close the modal
    closeModal();
  }
  
  // Close the modal
  function closeModal() {
    $uiState.showRegionModal = false;
    $uiState.editingRegion = null;
    $uiState.selectedTiles = new Set();
    $uiState.isDrawingRegion = false;
  }
</script>

{#if $uiState.showRegionModal}
  <div class="modal-backdrop" onclick={closeModal}>
    <div class="modal" onclick={e => e.stopPropagation()}>
      <div class="modal-header">
        <h2>{$uiState.editingRegion ? 'Edit' : 'Create'} Region</h2>
        <button class="close-button" onclick={closeModal}>×</button>
      </div>
      
      <div class="modal-body">
        <form onsubmit={e => { e.preventDefault(); handleSubmit(); }}>
          <div class="form-group">
            <label for="region-name">Region Name</label>
            <input 
              type="text" 
              id="region-name" 
              bind:value={name} 
              placeholder="Enter region name"
              autofocus
            />
          </div>
          
          <div class="form-group">
            <label>Region Color</label>
            <div class="color-grid">
              {#each colorOptions as option}
                <button 
                  type="button"
                  class="color-button" 
                  class:active={color === option.value}
                  onclick={() => color = option.value}
                  style="background-color: {option.value};"
                  title={option.name}
                ></button>
              {/each}
            </div>
          </div>
          
          <div class="selected-count">
            {#if $uiState.selectedTiles.size > 0}
              <span>{$uiState.selectedTiles.size} {$uiState.selectedTiles.size === 1 ? 'tile' : 'tiles'} selected</span>
            {:else if $uiState.editingRegion}
              <span>Editing region properties only</span>
              <button 
                type="button" 
                class="select-button"
                onclick={() => {
                  closeModal();
                  $uiState.currentTool = 'region';
                  $uiState.isDrawingRegion = true;
                  $uiState.editingRegion = $uiState.editingRegion;
                  const region = $mapData.regions.find(r => r.id === $uiState.editingRegion);
                  if (region) {
                    $uiState.selectedTiles = new Set(region.tiles);
                  }
                  $uiState.showRegionModal = false;
                }}
              >
                Select Tiles
              </button>
            {:else}
              <span class="warning">No tiles selected</span>
            {/if}
          </div>
          
          <div class="button-group">
            {#if $uiState.editingRegion}
              <button type="button" class="delete-button" onclick={handleDelete}>
                Delete Region
              </button>
            {/if}
            <button type="submit" class="save-button">
              {$uiState.editingRegion ? 'Save Changes' : 'Create Region'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal {
    background-color: #2a2a2a;
    border-radius: 0.5rem;
    width: 90%;
    max-width: 500px;
    color: white;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
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
  }
  
  .close-button {
    background: transparent;
    border: none;
    color: #aaa;
    font-size: 1.5rem;
    cursor: pointer;
  }
  
  .close-button:hover {
    color: white;
  }
  
  .modal-body {
    padding: 1rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #ccc;
  }
  
  input {
    width: 100%;
    padding: 0.5rem;
    background-color: #333;
    border: 1px solid #444;
    border-radius: 0.25rem;
    color: white;
  }
  
  input:focus {
    outline: none;
    border-color: #ff9800;
  }
  
  .color-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }
  
  .color-button {
    width: 100%;
    height: 2.5rem;
    border: 2px solid transparent;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .color-button:hover {
    transform: scale(1.05);
  }
  
  .color-button.active {
    border-color: white;
    box-shadow: 0 0 0 2px #000;
  }
  
  .selected-count {
    margin: 1rem 0;
    padding: 0.5rem;
    background-color: #333;
    border-radius: 0.25rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .warning {
    color: #ff9800;
  }
  
  .select-button {
    background-color: #333;
    border: 1px solid #666;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    cursor: pointer;
  }
  
  .select-button:hover {
    background-color: #444;
  }
  
  .button-group {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  
  .save-button, .delete-button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-weight: bold;
  }
  
  .save-button {
    background-color: #4caf50;
    color: white;
  }
  
  .save-button:hover {
    background-color: #3e8e41;
  }
  
  .delete-button {
    background-color: #f44336;
    color: white;
  }
  
  .delete-button:hover {
    background-color: #d32f2f;
  }
</style>
