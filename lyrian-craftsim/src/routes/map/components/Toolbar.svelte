<script lang="ts">
  import { uiState, setTool, clearSelection, showRegionModal } from '$lib/map/stores/uiStore';
  import { mapData } from '$lib/map/stores/mapStore';
  
  // Biome options for the tool
  const biomeOptions = [
    { id: 'plains', name: 'Plains', color: '#a5d6a7' },
    { id: 'forest', name: 'Forest', color: '#66bb6a' },
    { id: 'desert', name: 'Desert', color: '#ffe082' },
    { id: 'mountains', name: 'Mountains', color: '#9e9e9e' },
    { id: 'water', name: 'Water', color: '#64b5f6' },
    { id: 'swamp', name: 'Swamp', color: '#8d6e63' },
    { id: 'snow', name: 'Snow', color: '#e0e0e0' },
    { id: 'hills', name: 'Hills', color: '#bcaaa4' }
  ];
  
  // POI options for the tool
  const poiOptions = [
    { id: 'city', name: 'City', icon: '🏙️' },
    { id: 'town', name: 'Town', icon: '🏘️' },
    { id: 'ruin', name: 'Ruin', icon: '🏛️' },
    { id: 'cave', name: 'Cave', icon: '🕳️' },
    { id: 'castle', name: 'Castle', icon: '🏰' },
    { id: 'camp', name: 'Camp', icon: '⛺' },
    { id: 'temple', name: 'Temple', icon: '🕌' },
    { id: 'landmark', name: 'Landmark', icon: '🗿' }
  ];
  
  // Handle tool change
  function handleToolChange(tool: 'biome' | 'poi' | 'region' | 'resize' | null) {
    setTool(tool);
  }
  
  // Set biome selection
  function selectBiome(biome: string) {
    $uiState.selectedBiome = biome;
  }
  
  // Set POI selection
  function selectPoi(poi: string) {
    $uiState.selectedPoi = poi;
  }
  
  // Start region creation
  function startRegionCreation() {
    if ($uiState.selectedTiles.size === 0) {
      // If no tiles are selected, show an alert
      alert('Please select tiles on the map first before creating a region.');
      return;
    }
    // Open region modal
    showRegionModal();
  }
  
  // Toggle tool visibility
  let showBiomes = $state(false);
  let showPOIs = $state(false);
</script>

<div class="toolbar">
  <section class="tools">
    <h3>Tools</h3>
    <div class="tool-buttons">
      <button 
        class:active={$uiState.currentTool === 'biome'}
        onclick={() => handleToolChange('biome')}
        title="Biome Brush"
      >
        <span class="icon">🏝️</span>
        <span class="label">Biome</span>
      </button>
      
      <button 
        class:active={$uiState.currentTool === 'poi'}
        onclick={() => handleToolChange('poi')}
        title="Points of Interest"
      >
        <span class="icon">📍</span>
        <span class="label">POI</span>
      </button>
      
      <button 
        class:active={$uiState.currentTool === 'region'}
        onclick={() => handleToolChange('region')}
        title="Region Tool"
      >
        <span class="icon">🔳</span>
        <span class="label">Region</span>
      </button>
      
      <button 
        class:active={$uiState.currentTool === null}
        onclick={() => handleToolChange(null)}
        title="Selection Tool"
      >
        <span class="icon">👆</span>
        <span class="label">Select</span>
      </button>
    </div>
  </section>
  
  <!-- Show biome options when biome tool is selected -->
  {#if $uiState.currentTool === 'biome' || showBiomes}
    <section class="biome-options">
      <h3>
        Biomes
        {#if $uiState.currentTool !== 'biome'}
          <button class="close-button" onclick={() => showBiomes = false}>×</button>
        {/if}
      </h3>
      
      <div class="biome-grid">
        {#each biomeOptions as biome}
          <button 
            class="biome-button" 
            class:active={$uiState.selectedBiome === biome.id}
            onclick={() => selectBiome(biome.id)}
            style="background-color: {biome.color};"
            title={biome.name}
          >
            <span class="biome-name">{biome.name}</span>
          </button>
        {/each}
      </div>
    </section>
  {/if}
  
  <!-- Show POI options when POI tool is selected -->
  {#if $uiState.currentTool === 'poi' || showPOIs}
    <section class="poi-options">
      <h3>
        Points of Interest
        {#if $uiState.currentTool !== 'poi'}
          <button class="close-button" onclick={() => showPOIs = false}>×</button>
        {/if}
      </h3>
      
      <div class="poi-grid">
        {#each poiOptions as poi}
          <button 
            class="poi-button" 
            class:active={$uiState.selectedPoi === poi.id}
            onclick={() => selectPoi(poi.id)}
            title={poi.name}
          >
            <span class="poi-icon">{poi.icon}</span>
            <span class="poi-name">{poi.name}</span>
          </button>
        {/each}
      </div>
    </section>
  {/if}
  
  <!-- Show region options when region tool is selected -->
  {#if $uiState.currentTool === 'region'}
    <section class="region-options">
      <h3>Region Tool</h3>
      
      <div class="region-info">
        <p>Selected tiles: {$uiState.selectedTiles.size}</p>
        <div class="region-actions">
          <button 
            class="action-button create-button" 
            onclick={startRegionCreation}
            disabled={$uiState.selectedTiles.size === 0}
          >
            Create Region
          </button>
          
          <button 
            class="action-button clear-button" 
            onclick={() => clearSelection()}
            disabled={$uiState.selectedTiles.size === 0}
          >
            Clear Selection
          </button>
        </div>
      </div>
      
      {#if $mapData.regions.length > 0}
        <div class="existing-regions">
          <h4>Existing Regions</h4>
          <ul class="region-list">
            {#each $mapData.regions as region}
              <li class="region-item">
                <span class="region-color" style="background-color: {region.color};"></span>
                <span class="region-name">{region.name}</span>
                <button 
                  class="edit-button" 
                  onclick={() => showRegionModal(region.id)}
                >
                  Edit
                </button>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </section>
  {/if}
</div>

<style>
  .toolbar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    height: 100%;
    overflow-y: auto;
    color: white;
  }
  
  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: #ddd;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  h4 {
    margin: 0.5rem 0;
    font-size: 0.9rem;
    color: #bbb;
  }
  
  .close-button {
    background: transparent;
    border: none;
    color: #aaa;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .close-button:hover {
    color: white;
  }
  
  section {
    background-color: #2a2a2a;
    border-radius: 0.25rem;
    padding: 0.75rem;
    border: 1px solid #333;
  }
  
  .tool-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  
  button {
    background-color: #333;
    border: 1px solid #444;
    border-radius: 0.25rem;
    color: white;
    padding: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  button:hover {
    background-color: #444;
  }
  
  button.active {
    background-color: #555;
    border-color: #ff9800;
  }
  
  .icon {
    font-size: 1.25rem;
    display: block;
    margin-bottom: 0.25rem;
  }
  
  .label {
    font-size: 0.8rem;
  }
  
  .biome-grid, .poi-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  
  .biome-button, .poi-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem;
    height: 60px;
    justify-content: center;
  }
  
  .biome-button {
    color: #111;
    font-weight: bold;
    text-shadow: 0 0 2px rgba(255, 255, 255, 0.5);
  }
  
  .biome-button.active, .poi-button.active {
    outline: 2px solid #ff9800;
    transform: scale(1.05);
  }
  
  .poi-icon {
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
  }
  
  .poi-name, .biome-name {
    font-size: 0.75rem;
    white-space: nowrap;
  }
  
  .region-info {
    margin-bottom: 0.5rem;
  }
  
  .region-info p {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
  }
  
  .region-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .action-button {
    flex: 1;
    padding: 0.5rem;
    font-size: 0.8rem;
  }
  
  .create-button {
    background-color: #2e7d32;
  }
  
  .create-button:hover {
    background-color: #388e3c;
  }
  
  .create-button:disabled {
    background-color: #1b5e20;
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .clear-button {
    background-color: #d32f2f;
  }
  
  .clear-button:hover {
    background-color: #f44336;
  }
  
  .clear-button:disabled {
    background-color: #c62828;
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .region-list {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 200px;
    overflow-y: auto;
  }
  
  .region-item {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    background-color: #333;
    margin-bottom: 0.25rem;
    border-radius: 0.25rem;
  }
  
  .region-color {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    margin-right: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .region-name {
    flex: 1;
    font-size: 0.9rem;
  }
  
  .edit-button {
    background-color: #2196f3;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    border-radius: 0.25rem;
  }
  
  .edit-button:hover {
    background-color: #1976d2;
  }
</style>
