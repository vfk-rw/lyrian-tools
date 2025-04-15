<script lang="ts">
  import { uiStore, closeModal, POI_TYPES, type POIModalParams } from '$lib/map/stores/uiStore';
  import { addPOI, updatePOI, removePOI } from '$lib/map/stores/mapStore';
  import { v4 as uuidv4 } from 'uuid';
  import '$lib/styles/modal.css';
  
  // Form state
  let poiName = '';
  let poiIcon = 'landmark';
  let poiDescription = '';
  
  // Computed properties
  $: isEditing = $uiStore.modalParams?.type === 'poi' && ($uiStore.modalParams as POIModalParams).editingPOI !== undefined;
  $: modalTitle = isEditing ? 'Edit Point of Interest' : 'Add New Point of Interest';
  $: tileKey = $uiStore.modalParams?.type === 'poi' ? ($uiStore.modalParams as POIModalParams).tileKey || '' : '';
  
  // Initialize form when the modal is shown
  $: if ($uiStore.showModal && $uiStore.modalParams?.type === 'poi') {
    if (isEditing) {
      // Populate form with existing POI data
      const modalParams = $uiStore.modalParams as POIModalParams;
      const editingPOI = modalParams.editingPOI;
      if (editingPOI) {
        poiName = editingPOI.name;
        poiIcon = editingPOI.icon;
        poiDescription = editingPOI.description || '';
      }
    } else {
      // Default values for new POI
      poiName = '';
      poiIcon = 'landmark';
      poiDescription = '';
    }
  }
  
  // Handle form submission
  function handleSubmit() {
    if (!tileKey || !poiName) return;
    
    if (isEditing && $uiStore.modalParams?.type === 'poi') {
      // Update existing POI
      const modalParams = $uiStore.modalParams as POIModalParams;
      const editingPOI = modalParams.editingPOI;
      if (editingPOI) {
        updatePOI(
          tileKey,
          {
            id: editingPOI.id,
            name: poiName,
            icon: poiIcon,
            description: poiDescription
          }
        );
      }
    } else {
      // Add new POI
      addPOI(tileKey, {
        name: poiName,
        icon: poiIcon,
        description: poiDescription
      });
    }
    
    // Close the modal
    closeModal();
  }
  
  // Handle POI deletion
  function handleDelete() {
    if (isEditing && $uiStore.modalParams?.type === 'poi' && tileKey) {
      const modalParams = $uiStore.modalParams as POIModalParams;
      const editingPOI = modalParams.editingPOI;
      if (editingPOI) {
        removePOI(tileKey, editingPOI.id);
        closeModal();
      }
    }
  }
  
  // Handle modal close
  function handleCancel() {
    closeModal();
  }
  
  // Icon display helpers
  const POI_ICONS: Record<string, string> = {
    town: '🏘️',
    city: '🏙️',
    castle: '🏰',
    dungeon: '🏛️',
    cave: '🗻',
    temple: '⛩️',
    camp: '⛺',
    ruins: '🏚️',
    port: '⚓',
    mountain: '⛰️',
    forest: '🌲',
    landmark: '🗿',
    quest: '❗',
    treasure: '💰',
    default: '📍'
  };
</script>

<!-- Modal backdrop -->
{#if $uiStore.showModal && $uiStore.modalParams?.type === 'poi'}
  <div class="modal-backdrop" on:click={handleCancel} on:keydown={e => e.key === 'Escape' && handleCancel()} role="dialog" aria-modal="true">
    <div class="modal-content" on:click|stopPropagation role="document">
      <div class="modal-header">
        <h2>{modalTitle}</h2>
        <button class="close-button" on:click={handleCancel}>×</button>
      </div>
      
      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
          <label for="poi-name">Name</label>
          <input 
            type="text" 
            id="poi-name" 
            bind:value={poiName} 
            required
            placeholder="Enter POI name"
          />
        </div>
        
        <div class="form-group">
          <label id="poi-icon-label">Icon</label>
          <div class="icon-grid">
            {#each POI_TYPES as iconType}
              <button 
                type="button"
                class="icon-button"
                class:active={poiIcon === iconType}
                on:click={() => poiIcon = iconType}
                title={iconType.charAt(0).toUpperCase() + iconType.slice(1)}
                aria-labelledby="poi-icon-label"
              >
                <span class="icon">{POI_ICONS[iconType] || POI_ICONS.default}</span>
              </button>
            {/each}
          </div>
        </div>
        
        <div class="form-group">
          <label for="poi-description">Description</label>
          <textarea 
            id="poi-description" 
            bind:value={poiDescription}
            rows="3"
            placeholder="Enter description (optional)"
          ></textarea>
        </div>
        
        <div class="button-row">
          {#if isEditing}
            <button type="button" class="delete-button" on:click={handleDelete}>
              Delete
            </button>
          {/if}
          
          <button type="button" class="cancel-button" on:click={handleCancel}>
            Cancel
          </button>
          
          <button type="submit" class="submit-button">
            {isEditing ? 'Update' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  /* POI-specific modifications */
  .icon-grid {
    grid-template-columns: repeat(7, 1fr);
  }
</style>
