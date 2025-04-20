<script lang="ts">
  import { saveMap, loadMap } from '$lib/utils/saveLoad';
  import { mapStore } from '$lib/stores/mapStore';
  import { selectedTile } from '$lib/stores/tileStore';
  import HelpModal from './HelpModal.svelte';
  import '$lib/styles/toolbar.css';
  
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
  
  <div class="middle-buttons">
    <div class="map-info">
      <div class="info-text">
        Tiles: 256px × 171px
        <div class="info-details">(optimal ratio for hex terrain)</div>
      </div>
    </div>
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