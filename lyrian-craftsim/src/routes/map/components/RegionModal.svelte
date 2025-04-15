<script lang="ts">
  import { uiStore, closeModal, createRegion, type RegionModalParams } from '$lib/map/stores/uiStore';
  import { addRegion, updateRegion, removeRegion } from '$lib/map/stores/mapStore';
  import { v4 as uuidv4 } from 'uuid';
  import '$lib/styles/modal.css';
  
  // Form state
  let regionName = '';
  let regionDescription = '';
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
  $: isEditing = $uiStore.modalParams?.type === 'region' && ($uiStore.modalParams as RegionModalParams).regionId !== undefined;
  $: modalTitle = isEditing ? 'Edit Region' : 'Create New Region';
  $: regionId = $uiStore.modalParams?.type === 'region' ? ($uiStore.modalParams as RegionModalParams).regionId || '' : '';
  $: selectedTiles = $uiStore.selectedTiles || [];
  
  // Initialize form when the modal is shown
  $: if ($uiStore.showModal && $uiStore.modalParams?.type === 'region') {
    if (isEditing) {
      // Find the region by ID
      const modalParams = $uiStore.modalParams as RegionModalParams;
      const regionId = modalParams.regionId;
      const region = regionId ? getRegionById(regionId) : null;
      
      if (region) {
        // Populate form with existing region data
        regionName = region.name;
        regionColor = region.color;
        regionDescription = region.description || '';
      }
    } else {
      // Default values for new region
      regionName = `Region ${Math.floor(Math.random() * 1000)}`;
      regionColor = REGION_COLORS[Math.floor(Math.random() * REGION_COLORS.length)];
      regionDescription = '';
    }
  }
  
  // Helper function to get a region by ID
  function getRegionById(id: string) {
    return $mapData?.regions.get(id) || null;
  }
  
  // Handle form submission
  function handleSubmit() {
    if (!regionName) return;
    
    if (isEditing && regionId) {
      // Update existing region
      updateRegion(regionId, {
        name: regionName,
        color: regionColor,
        description: regionDescription
      });
    } else {
      // Create a new region
      if (selectedTiles.length > 0) {
        createRegion(regionName, regionColor, regionDescription);
      } else {
        // If no tiles selected, create an empty region
        addRegion({
          id: uuidv4(),
          name: regionName,
          color: regionColor,
          description: regionDescription,
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
  <div class="modal-backdrop" on:click={handleCancel} on:keydown={e => e.key === 'Escape' && handleCancel()} role="dialog" aria-modal="true">
    <div class="modal-content" on:click|stopPropagation role="document">
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
          <label for="region-description">Region Description</label>
          <textarea
            id="region-description"
            bind:value={regionDescription}
            placeholder="Enter region description (optional)"
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="region-color">Region Color</label>
          <div class="color-input-row">
            <input type="color" id="region-color" bind:value={regionColor} />
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
                aria-label={`Select color ${color}`}
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
  /* Region-specific modifications */
  .selected-tiles-info {
    margin: 1rem 0;
    padding: 0.75rem;
    background-color: #333;
    border-radius: 0.25rem;
    font-size: 0.9rem;
    text-align: center;
  }
</style>
