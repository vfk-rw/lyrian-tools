<script lang="ts">
  import { uiStore } from '$lib/stores/uiStore';
  import { mapStore } from '$lib/stores/mapStore';
  import { historyStore } from '$lib/stores/historyStore';
  
  let name = '';
  let description = '';
  let error = '';
  
  // Get the selected POI data when the modal opens
  $: if ($uiStore.isPOIEditModalOpen && $mapStore.selectedPOI) {
    const poi = $mapStore.pois.get($mapStore.selectedPOI);
    if (poi) {
      name = poi.name;
      description = poi.description;
    }
  }
  
  // Save POI changes
  function savePOI() {
    // Validate inputs
    if (!name.trim()) {
      error = 'POI name cannot be empty';
      return;
    }
    
    if ($mapStore.selectedPOI) {
      mapStore.updatePOI($mapStore.selectedPOI, {
        name,
        description
      });
      historyStore.pushState('Update POI');
      closeModal();
    }
  }
  
  // Delete the selected POI
  function deletePOI() {
    if ($mapStore.selectedPOI) {
      if (confirm('Are you sure you want to delete this POI?')) {
        mapStore.deletePOI($mapStore.selectedPOI);
        historyStore.pushState('Delete POI');
        closeModal();
      }
    }
  }
  
  // Close the modal
  function closeModal() {
    name = '';
    description = '';
    error = '';
    uiStore.togglePOIEditModal();
  }
</script>

{#if $uiStore.isPOIEditModalOpen && $mapStore.selectedPOI}
  <div class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h2>Edit Point of Interest</h2>
        <button class="close-button" on:click={closeModal}>×</button>
      </div>
      
      <div class="modal-content">
        <div class="form-group">
          <label for="poi-name">Name</label>
          <input 
            type="text" 
            id="poi-name" 
            bind:value={name} 
            placeholder="Enter POI name"
          />
        </div>
        
        <div class="form-group">
          <label for="poi-description">Description</label>
          <textarea 
            id="poi-description" 
            bind:value={description} 
            placeholder="Enter POI description"
            rows="5"
          ></textarea>
        </div>
        
        {#if error}
          <div class="error-message">{error}</div>
        {/if}
        
        <div class="modal-actions">
          <button class="delete" on:click={deletePOI}>Delete</button>
          <div class="spacer"></div>
          <button class="cancel" on:click={closeModal}>Cancel</button>
          <button class="save" on:click={savePOI}>Save</button>
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