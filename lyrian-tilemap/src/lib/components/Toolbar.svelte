<script lang="ts">
  import { saveMap, loadMap } from '$lib/utils/saveLoad';
  import { mapStore } from '$lib/stores/mapStore';
  import { selectedTile } from '$lib/stores/tileStore';
  import HelpModal from './HelpModal.svelte';
  
  let mapName = 'tilemap';
  let width = $mapStore.width;
  let height = $mapStore.height;
  let showHelp = false;
  
  // Handler for saving the map
  async function handleSave() {
    try {
      saveMap($mapStore, mapName);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error saving map: ${errorMessage}`);
    }
  }
  
  // Handler for loading a map
  async function handleLoad() {
    try {
      const mapData = await loadMap();
      mapStore.importMap(mapData);
      width = mapData.width;
      height = mapData.height;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error loading map: ${errorMessage}`);
    }
  }
  
  // Handler for resizing the map
  function handleResize() {
    const parsedWidth = parseInt(width.toString());
    const parsedHeight = parseInt(height.toString());
    
    if (isNaN(parsedWidth) || isNaN(parsedHeight)) {
      alert("Width and height must be numbers");
      return;
    }
    
    if (parsedWidth < 1 || parsedWidth > 100 || parsedHeight < 1 || parsedHeight > 100) {
      alert("Width and height must be between 1 and 100");
      return;
    }
    
    mapStore.resize(parsedWidth, parsedHeight);
  }
  
  // Handler for clearing the selected tile
  function clearSelection() {
    selectedTile.set(null);
  }
  
  // Handler for creating a new map
  function handleNew() {
    if (confirm("Create a new map? This will clear your current work.")) {
      mapStore.reset();
    }
  }
  
  // Toggle help modal
  function toggleHelp() {
    showHelp = !showHelp;
  }
</script>

<div class="toolbar">
  <div class="left-buttons">
    <button 
      class="btn btn-primary"
      onclick={handleNew}
    >
      New
    </button>
    
    <div class="input-group">
      <input 
        type="text" 
        bind:value={mapName}
        placeholder="Map name" 
        class="input-name"
      />
      <button 
        class="btn btn-success"
        onclick={handleSave}
      >
        Save
      </button>
    </div>
    
    <button 
      class="btn btn-info"
      onclick={handleLoad}
    >
      Load
    </button>
  </div>
  
  <div class="right-buttons">
    <div class="input-group">
      <label class="input-label">Width:</label>
      <input 
        type="number" 
        bind:value={width}
        min="1" 
        max="100" 
        class="input-dimension"
      />
    </div>
    
    <div class="input-group">
      <label class="input-label">Height:</label>
      <input 
        type="number" 
        bind:value={height}
        min="1" 
        max="100" 
        class="input-dimension"
      />
    </div>
    
    <button 
      class="btn btn-warning"
      onclick={handleResize}
    >
      Resize
    </button>
    
    <button 
      class="btn btn-secondary"
      onclick={clearSelection}
    >
      Clear Selection
    </button>
    
    <button 
      class="btn btn-accent"
      onclick={toggleHelp}
    >
      Help
    </button>
  </div>
  
  <HelpModal isOpen={showHelp} toggleHelp={toggleHelp} />
</div>

<style>
  /* Regular CSS without Tailwind reference */
  .toolbar {
    background-color: #1f2937;
    color: white;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #374151;
    position: sticky;
    top: 0;
    z-index: 20;
  }
  
  .left-buttons, .right-buttons {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .input-group {
    display: flex;
    align-items: center;
  }
  
  .input-label {
    margin-right: 0.5rem;
    font-size: 0.875rem;
  }
  
  .input-name {
    background-color: #374151;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem 0 0 0.25rem;
    width: 6rem;
  }
  
  .input-dimension {
    background-color: #374151;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    width: 4rem;
  }
  
  .btn {
    padding: 0.25rem 0.75rem;
    border-radius: 0.25rem;
    color: white;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .btn-primary {
    background-color: #2563eb;
  }
  
  .btn-primary:hover {
    background-color: #1d4ed8;
  }
  
  .btn-success {
    background-color: #16a34a;
    border-radius: 0 0.25rem 0.25rem 0;
  }
  
  .btn-success:hover {
    background-color: #15803d;
  }
  
  .btn-info {
    background-color: #4f46e5;
  }
  
  .btn-info:hover {
    background-color: #4338ca;
  }
  
  .btn-warning {
    background-color: #ca8a04;
  }
  
  .btn-warning:hover {
    background-color: #a16207;
  }
  
  .btn-secondary {
    background-color: #4b5563;
  }
  
  .btn-secondary:hover {
    background-color: #374151;
  }
  
  .btn-accent {
    background-color: #9333ea;
  }
  
  .btn-accent:hover {
    background-color: #7e22ce;
  }
</style>