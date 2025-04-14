<script lang="ts">
  import { uiState } from '$lib/map/stores/uiStore';
  import { mapData } from '$lib/map/stores/mapStore';
  import type { POI } from '$lib/map/stores/mapStore';
  
  // Simple ID generator function
  function generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
  
  // POI form fields
  let name = '';
  let description = '';
  let icon = 'city';  // Default icon
  
  // Icon options for POIs
  const iconOptions = [
    { id: 'city', name: 'City', icon: '🏙️' },
    { id: 'town', name: 'Town', icon: '🏘️' },
    { id: 'village', name: 'Village', icon: '🏡' },
    { id: 'castle', name: 'Castle', icon: '🏰' },
    { id: 'ruin', name: 'Ruin', icon: '🏛️' },
    { id: 'cave', name: 'Cave', icon: '🕳️' },
    { id: 'camp', name: 'Camp', icon: '⛺' },
    { id: 'temple', name: 'Temple', icon: '🕌' },
    { id: 'mountain', name: 'Mountain', icon: '⛰️' },
    { id: 'forest', name: 'Forest', icon: '🌲' },
    { id: 'lake', name: 'Lake', icon: '🌊' },
    { id: 'bridge', name: 'Bridge', icon: '🌉' },
    { id: 'landmark', name: 'Landmark', icon: '🗿' },
    { id: 'treasure', name: 'Treasure', icon: '💰' },
    { id: 'danger', name: 'Danger', icon: '⚠️' },
    { id: 'quest', name: 'Quest', icon: '❗' }
  ];
  
  // Store the selected tile key
  let selectedTileKey: string | null = null;
  let isEditing = false;
  
  // When the modal is shown, initialize form fields
  $: if ($uiState.showPoiModal) {
    // Get the selected tile key
    const selectedKeys = Array.from($uiState.selectedTiles);
    if (selectedKeys.length === 0) {
      closeModal();
    } else {
      selectedTileKey = selectedKeys[0];
      
      // If we're editing an existing POI, fill the form with its data
      if ($uiState.editingPoi !== null && selectedTileKey) {
        const tile = $mapData.tiles.get(selectedTileKey);
        if (tile && tile.pois) {
          const poi = tile.pois.find(p => p.id === $uiState.editingPoi);
          if (poi) {
            name = poi.name;
            description = poi.description || '';
            icon = poi.icon;
            isEditing = true;
          }
        }
      } else {
        // Reset form for new POI
        name = '';
        description = '';
        icon = $uiState.selectedPoi || 'city';
        isEditing = false;
      }
    }
  }
  
  // Submit handler
  function handleSubmit() {
    // Validation
    if (!name.trim()) {
      alert('Please enter a name for the POI');
      return;
    }
    
    if (!selectedTileKey) {
      alert('No tile selected');
      return;
    }
    
    // Create the POI object with required fields
    const poi: POI = {
      id: $uiState.editingPoi || generateId(),
      name,
      description: description || '', // POI requires description to be a string
      icon
    };
    
    // Update the map data
    const tile = $mapData.tiles.get(selectedTileKey);
    if (tile) {
      const updatedTile = { ...tile };
      
      if (!updatedTile.pois) {
        updatedTile.pois = [];
      }
      
      if (isEditing) {
        // Update existing POI
        const poiIndex = updatedTile.pois.findIndex(p => p.id === $uiState.editingPoi);
        if (poiIndex !== -1) {
          updatedTile.pois[poiIndex] = poi;
        }
      } else {
        // Add new POI
        updatedTile.pois.push(poi);
      }
      
      // Update the map data
      $mapData.tiles.set(selectedTileKey, updatedTile);
    }
    
    // Close the modal
    closeModal();
  }
  
  // Delete handler
  function handleDelete() {
    if (!isEditing || !selectedTileKey || !$uiState.editingPoi) {
      return;
    }
    
    if (!confirm('Are you sure you want to delete this POI?')) {
      return;
    }
    
    // Get the tile
    const tile = $mapData.tiles.get(selectedTileKey);
    if (tile && tile.pois) {
      const updatedTile = { ...tile };
      // Remove the POI with the matched ID
      updatedTile.pois = updatedTile.pois.filter(p => p.id !== $uiState.editingPoi);
      // Update the map data
      $mapData.tiles.set(selectedTileKey, updatedTile);
    }
    
    // Close the modal
    closeModal();
  }
  
  // Close the modal
  function closeModal() {
    $uiState.showPoiModal = false;
    $uiState.editingPoi = null;
  }
</script>

{#if $uiState.showPoiModal}
  <div class="modal-backdrop" onclick={closeModal}>
    <div class="modal" onclick={e => e.stopPropagation()}>
      <div class="modal-header">
        <h2>{isEditing ? 'Edit' : 'Add'} Point of Interest</h2>
        <button class="close-button" onclick={closeModal}>×</button>
      </div>
      
      <div class="modal-body">
        <form onsubmit={e => { e.preventDefault(); handleSubmit(); }}>
          <div class="form-group">
            <label for="poi-name">Name</label>
            <input 
              type="text" 
              id="poi-name" 
              bind:value={name} 
              placeholder="Enter POI name"
              autofocus
            />
          </div>
          
          <div class="form-group">
            <label for="poi-description">Description</label>
            <textarea 
              id="poi-description" 
              bind:value={description} 
              placeholder="Enter description (optional)"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>Icon</label>
            <div class="icon-grid">
              {#each iconOptions as option}
                <button 
                  type="button"
                  class="icon-button" 
                  class:active={icon === option.id}
                  onclick={() => icon = option.id}
                  title={option.name}
                >
                  <span class="poi-icon">{option.icon}</span>
                  <span class="icon-name">{option.name}</span>
                </button>
              {/each}
            </div>
          </div>
          
          <div class="button-group">
            {#if isEditing}
              <button type="button" class="delete-button" onclick={handleDelete}>
                Delete POI
              </button>
            {/if}
            <button type="submit" class="save-button">
              {isEditing ? 'Save Changes' : 'Add POI'}
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
    max-height: 90vh;
    display: flex;
    flex-direction: column;
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
    overflow-y: auto;
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
  
  input, textarea {
    width: 100%;
    padding: 0.5rem;
    background-color: #333;
    border: 1px solid #444;
    border-radius: 0.25rem;
    color: white;
  }
  
  input:focus, textarea:focus {
    outline: none;
    border-color: #ff9800;
  }
  
  textarea {
    resize: vertical;
  }
  
  .icon-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    max-height: 240px;
    overflow-y: auto;
    padding-right: 0.25rem;
  }
  
  .icon-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    background-color: #333;
    border: 1px solid #444;
    border-radius: 0.25rem;
    cursor: pointer;
    height: 70px;
  }
  
  .icon-button:hover {
    background-color: #444;
  }
  
  .icon-button.active {
    background-color: #555;
    border-color: #ff9800;
    outline: 2px solid #ff9800;
  }
  
  .poi-icon {
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
  }
  
  .icon-name {
    font-size: 0.65rem;
    white-space: nowrap;
    text-align: center;
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
