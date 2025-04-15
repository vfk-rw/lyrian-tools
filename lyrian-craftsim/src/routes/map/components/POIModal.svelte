<script lang="ts">
  import { uiStore, closeModal, POI_TYPES } from '$lib/map/stores/uiStore';
  import { addPOI, updatePOI, removePOI } from '$lib/map/stores/mapStore';
  import { v4 as uuidv4 } from 'uuid';
  
  // Form state
  let poiName = '';
  let poiIcon = 'landmark';
  let poiDescription = '';
  
  // Computed properties
  $: isEditing = $uiStore.modalParams?.editingPOI !== undefined;
  $: modalTitle = isEditing ? 'Edit Point of Interest' : 'Add New Point of Interest';
  $: tileKey = $uiStore.modalParams?.tileKey || '';
  
  // Initialize form when the modal is shown
  $: if ($uiStore.showModal && $uiStore.modalParams?.type === 'poi') {
    if (isEditing && $uiStore.modalParams?.editingPOI) {
      // Populate form with existing POI data
      poiName = $uiStore.modalParams.editingPOI.name;
      poiIcon = $uiStore.modalParams.editingPOI.icon;
      poiDescription = $uiStore.modalParams.editingPOI.description || '';
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
    
    if (isEditing && $uiStore.modalParams?.editingPOI) {
      // Update existing POI
      updatePOI(
        tileKey,
        $uiStore.modalParams.editingPOI.id,
        {
          name: poiName,
          icon: poiIcon,
          description: poiDescription
        }
      );
    } else {
      // Add new POI with a generated ID
      addPOI(tileKey, {
        id: uuidv4(),
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
    if (isEditing && $uiStore.modalParams?.editingPOI && tileKey) {
      removePOI(tileKey, $uiStore.modalParams.editingPOI.id);
      closeModal();
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
  <div class="modal-backdrop" on:click={handleCancel}>
    <div class="modal-content" on:click|stopPropagation>
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
          <label>Icon</label>
          <div class="icon-grid">
            {#each POI_TYPES as iconType}
              <button 
                type="button"
                class="icon-button"
                class:active={poiIcon === iconType}
                on:click={() => poiIcon = iconType}
                title={iconType.charAt(0).toUpperCase() + iconType.slice(1)}
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
  
  input, textarea {
    width: 100%;
    padding: 0.75rem;
    background-color: #333;
    border: 1px solid #444;
    border-radius: 0.25rem;
    color: white;
    font-size: 1rem;
  }
  
  input:focus, textarea:focus {
    outline: none;
    border-color: #666;
  }
  
  .icon-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem;
  }
  
  .icon-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    background-color: #333;
    border: 1px solid #444;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .icon-button:hover {
    background-color: #444;
  }
  
  .icon-button.active {
    background-color: #555;
    border-color: #ccc;
    box-shadow: 0 0 0 2px #aaa;
  }
  
  .icon {
    font-size: 1.25rem;
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
  
  .delete-button {
    background-color: #f44336;
    color: white;
    margin-right: auto;
  }
  
  .delete-button:hover {
    background-color: #d32f2f;
  }
</style>
