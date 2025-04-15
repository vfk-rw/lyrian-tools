<script lang="ts">
  import { uiStore, selectTool, selectBiome, selectHeight, toggleLabels, toggleGrid, BIOME_TYPES } from '$lib/map/stores/uiStore';
  
  // Color mapping for biomes
  const BIOME_COLORS: Record<string, string> = {
    plains: '#91C13D',    // light green
    forest: '#2C7C30',    // dark green
    mountain: '#8B4513',  // brown
    water: '#1E90FF',     // blue
    desert: '#F4D03F',    // yellow
    swamp: '#556B2F',     // olive
    tundra: '#F0F0F0',    // white
  };
  
  // Height values
  const HEIGHT_OPTIONS = [0, 1, 2, 3];
  
  // Tool descriptions
  const TOOL_DESCRIPTIONS: Record<string, string> = {
    select: 'Select tiles to form regions',
    biome: 'Paint different terrain types',
    height: 'Adjust elevation of tiles',
    poi: 'Add points of interest',
    region: 'Create and edit regions',
    resize: 'Add or remove tiles from the map'
  };
  
  // Get current tool description
  $: toolDescription = TOOL_DESCRIPTIONS[$uiStore.currentTool] || '';
  
  // Handle tool selection
  function handleToolSelect(tool: string): void {
    selectTool(tool as any);
  }
  
  // Handle biome selection
  function handleBiomeSelect(biome: string): void {
    selectBiome(biome);
  }
  
  // Handle height selection
  function handleHeightSelect(height: number): void {
    selectHeight(height);
  }
  
  // Handle labels toggle
  function handleToggleLabels(): void {
    toggleLabels();
  }
  
  // Handle grid toggle
  function handleToggleGrid(): void {
    toggleGrid();
  }
</script>

<div class="toolbar">
  <section class="toolbar-section">
    <h3>Tools</h3>
    <div class="tools-grid">
      <button 
        class="tool-button" 
        class:active={$uiStore.currentTool === 'select'}
        on:click={() => handleToolSelect('select')}
        title="Select Tool"
      >
        <span class="tool-icon">🖱️</span>
        <span class="tool-label">Select</span>
      </button>
      
      <button 
        class="tool-button" 
        class:active={$uiStore.currentTool === 'biome'}
        on:click={() => handleToolSelect('biome')}
        title="Biome Paint Tool"
      >
        <span class="tool-icon">🖌️</span>
        <span class="tool-label">Biome</span>
      </button>
      
      <button 
        class="tool-button" 
        class:active={$uiStore.currentTool === 'height'}
        on:click={() => handleToolSelect('height')}
        title="Height Tool"
      >
        <span class="tool-icon">⛰️</span>
        <span class="tool-label">Height</span>
      </button>
      
      <button 
        class="tool-button" 
        class:active={$uiStore.currentTool === 'poi'}
        on:click={() => handleToolSelect('poi')}
        title="POI Tool"
      >
        <span class="tool-icon">📍</span>
        <span class="tool-label">POI</span>
      </button>
      
      <button 
        class="tool-button" 
        class:active={$uiStore.currentTool === 'region'}
        on:click={() => handleToolSelect('region')}
        title="Region Tool"
      >
        <span class="tool-icon">🔷</span>
        <span class="tool-label">Region</span>
      </button>
      
      <button 
        class="tool-button" 
        class:active={$uiStore.currentTool === 'resize'}
        on:click={() => handleToolSelect('resize')}
        title="Resize Tool"
      >
        <span class="tool-icon">↔️</span>
        <span class="tool-label">Resize</span>
      </button>
    </div>
    
    <div class="tool-description">
      {toolDescription}
    </div>
  </section>
  
  {#if $uiStore.currentTool === 'biome'}
    <section class="toolbar-section">
      <h3>Biome Types</h3>
      <div class="biome-grid">
        {#each BIOME_TYPES as biome}
          <button 
            class="biome-button" 
            class:active={$uiStore.selectedBiome === biome}
            style:background-color={BIOME_COLORS[biome]}
            on:click={() => handleBiomeSelect(biome)}
            title={biome.charAt(0).toUpperCase() + biome.slice(1)}
            aria-label={biome.charAt(0).toUpperCase() + biome.slice(1)}
          >
          </button>
        {/each}
      </div>
      <div class="selected-biome">
        Selected: {$uiStore.selectedBiome}
      </div>
    </section>
  {/if}
  
  {#if $uiStore.currentTool === 'height'}
    <section class="toolbar-section">
      <h3>Height</h3>
      <div class="height-grid">
        {#each HEIGHT_OPTIONS as height}
          <button 
            class="height-button" 
            class:active={$uiStore.selectedHeight === height}
            on:click={() => handleHeightSelect(height)}
            title={height === 0 ? 'Flat' : `Elevation ${height}`}
          >
            {height}
          </button>
        {/each}
      </div>
      <div class="selected-height">
        Selected Height: {$uiStore.selectedHeight}
      </div>
    </section>
  {/if}
  
  <section class="toolbar-section">
    <h3>Display Options</h3>
    <div class="option-grid">
      <button 
        class="option-button" 
        class:active={$uiStore.showLabels}
        on:click={handleToggleLabels}
        title="Show/Hide Tile Labels"
      >
        <span class="option-icon">🏷️</span>
        <span class="option-label">Labels</span>
      </button>
      
      <button 
        class="option-button" 
        class:active={$uiStore.showGrid}
        on:click={handleToggleGrid}
        title="Show/Hide Grid"
      >
        <span class="option-icon">📊</span>
        <span class="option-label">Grid</span>
      </button>
    </div>
  </section>
  
  <section class="toolbar-section instructions">
    <h3>Instructions</h3>
    <ul class="instruction-list">
      <li>Pan: Alt+Drag or Middle Mouse</li>
      <li>Zoom: Mouse Wheel</li>
      <li>Select: Click tiles</li>
      <li>Add POI: Choose POI tool and click</li>
    </ul>
  </section>
</div>

<style>
  .toolbar {
    background-color: #2a2a2a;
    color: white;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    height: 100%;
    overflow-y: auto;
  }
  
  .toolbar-section {
    border-bottom: 1px solid #444;
    padding-bottom: 1rem;
  }
  
  .toolbar-section:last-child {
    border-bottom: none;
  }
  
  h3 {
    margin-top: 0;
    margin-bottom: 0.75rem;
    font-size: 1rem;
    font-weight: 500;
    color: #ccc;
  }
  
  .tools-grid, .biome-grid, .height-grid, .option-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
  
  .biome-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .tool-button, .option-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    background-color: #333;
    border: none;
    border-radius: 0.25rem;
    color: white;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .tool-button:hover, .option-button:hover {
    background-color: #444;
  }
  
  .tool-button.active, .option-button.active {
    background-color: #555;
    box-shadow: inset 0 0 0 2px #aaa;
  }
  
  .tool-icon, .option-icon {
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
  }
  
  .tool-label, .option-label {
    font-size: 0.75rem;
  }
  
  .biome-button {
    height: 2rem;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    transition: transform 0.2s;
  }
  
  .biome-button:hover {
    transform: scale(1.05);
  }
  
  .biome-button.active {
    box-shadow: inset 0 0 0 3px white;
  }
  
  .height-button {
    height: 2rem;
    border: none;
    border-radius: 0.25rem;
    background-color: #333;
    color: white;
    cursor: pointer;
    font-weight: bold;
  }
  
  .height-button:hover {
    background-color: #444;
  }
  
  .height-button.active {
    background-color: #555;
    box-shadow: inset 0 0 0 2px #aaa;
  }
  
  .tool-description, .selected-biome, .selected-height {
    font-size: 0.8rem;
    color: #aaa;
    text-align: center;
  }
  
  .instructions {
    margin-top: auto;
  }
  
  .instruction-list {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.8rem;
    color: #aaa;
  }
  
  .instruction-list li {
    margin-bottom: 0.25rem;
  }
</style>
