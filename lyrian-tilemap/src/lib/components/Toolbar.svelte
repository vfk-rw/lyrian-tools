<script lang="ts">
  import { saveMap, loadMap } from '$lib/utils/saveLoad';
  import { mapStore } from '$lib/stores/mapStore';
  import { selectedTile } from '$lib/stores/tileStore';
  import { tileSize, verticalTileSize } from '$lib/stores/gridStore';
  import HelpModal from './HelpModal.svelte';
  
  let mapName = 'tilemap';
  let width = $mapStore.width;
  let height = $mapStore.height;
  let showHelp = false;
  let newTileSize = $tileSize;
  let newVerticalTileSize = $verticalTileSize;
  
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
  
  // Handler for updating tile size
  function updateTileSize() {
    tileSize.set(newTileSize);
  }
  
  // Handler for updating vertical tile size
  function updateVerticalTileSize() {
    verticalTileSize.set(newVerticalTileSize);
  }

  // Calculate mathematically significant values based on original 256px tile size
  const exactTwoThirds = Math.round(256 * (2/3)); // 171px (mathematically perfect 2/3 ratio)
  const hexRatio = Math.round(256 * 0.6698); // 171px (typical hex vertical ratio ~67%)
  const goldenRatio = Math.round(256 * 0.6765); // 173px (golden ratio ~0.6765)
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
    <div class="tile-size-controls">
      <label>
        Tile Size: {newTileSize}px
        <input
          type="range"
          min="32"
          max="512"
          step="8"
          bind:value={newTileSize}
          class="tile-slider"
          oninput={updateTileSize}
        />
      </label>
      
      <label>
        Vertical Spacing: {newVerticalTileSize}px
        <input
          type="range"
          min="32"
          max="512"
          step="1"
          bind:value={newVerticalTileSize}
          class="tile-slider"
          oninput={updateVerticalTileSize}
        />
      </label>
      
      <div class="size-presets">
        <button class="btn btn-sm" onclick={() => { newTileSize = 64; updateTileSize(); }}>64px</button>
        <button class="btn btn-sm" onclick={() => { newTileSize = 128; updateTileSize(); }}>128px</button>
        <button class="btn btn-sm" onclick={() => { newTileSize = 256; updateTileSize(); }}>256px</button>
      </div>
      
      <div class="size-presets">
        <button class="btn btn-sm" onclick={() => { newVerticalTileSize = exactTwoThirds; updateVerticalTileSize(); }}>2/3 (171px)</button>
        <button class="btn btn-sm" onclick={() => { newVerticalTileSize = 170; updateVerticalTileSize(); }}>170px</button>
        <button class="btn btn-sm" onclick={() => { newVerticalTileSize = 172; updateVerticalTileSize(); }}>172px</button>
      </div>
      <div class="size-presets">
        <button class="btn btn-sm" onclick={() => { newVerticalTileSize = Math.floor(newTileSize * 0.75); updateVerticalTileSize(); }}>75%</button>
        <button class="btn btn-sm" onclick={() => { newVerticalTileSize = Math.floor(newTileSize * 0.5); updateVerticalTileSize(); }}>50%</button>
        <button class="btn btn-sm" onclick={() => { newVerticalTileSize = newTileSize; updateVerticalTileSize(); }}>1:1</button>
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
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .left-buttons, .right-buttons, .middle-buttons {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .middle-buttons {
    flex: 1;
    justify-content: center;
  }
  
  .tile-size-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    background-color: #374151;
    padding: 0.5rem;
    border-radius: 0.25rem;
    min-width: 250px;
  }
  
  .tile-slider {
    width: 100%;
    margin-top: 0.25rem;
    cursor: pointer;
  }
  
  .size-presets {
    display: flex;
    gap: 0.25rem;
    margin-top: 0.25rem;
  }
  
  .btn-sm {
    padding: 0.125rem 0.25rem;
    font-size: 0.75rem;
    background-color: #4b5563;
    border-radius: 0.125rem;
  }
  
  .btn-sm:hover {
    background-color: #374151;
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