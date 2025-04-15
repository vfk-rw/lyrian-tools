<script lang="ts">
  import MapCanvas from './components/MapCanvas.svelte';
  import Toolbar from './components/Toolbar.svelte';
  import POIModal from './components/POIModal.svelte';
  import RegionModal from './components/RegionModal.svelte';
  import { mapData, exportMapJSON, importMapJSON, setMapName, loadDemoMap, generateHexGrid } from '$lib/map/stores/mapStore';
  
  // Handle demo map loading
  function handleLoadDemo() {
    loadDemoMap();
  }
  
  // Handle export to JSON
  function handleExport() {
    // Create a JSON representation of the map
    const jsonData = exportMapJSON();
    const jsonString = JSON.stringify(jsonData, null, 2);
    
    // Create a blob and download it
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${jsonData.mapName.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
  
  // Handle import from JSON
  function handleImport() {
    // Create a file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement)?.files?.[0];
      if (!file) return;
      
      // Read the file
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        try {
          const jsonData = JSON.parse(readerEvent.target?.result as string);
          const success = importMapJSON(jsonData);
          
          if (success) {
            alert('Map imported successfully');
          } else {
            alert('Failed to import map - invalid format');
          }
        } catch (error) {
          console.error('Error importing map:', error);
          alert('Failed to import map - invalid JSON');
        }
      };
      reader.readAsText(file);
    };
    
    // Trigger the file input
    input.click();
  }
  
  // Track if it's the first load to set a map name
  let isFirstLoad = true;
  
  // Set a default map name on first load using Svelte 5's $effect
  $effect(() => {
    if (isFirstLoad && $mapData.tiles.size > 0) {
      isFirstLoad = false;
      const date = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      setMapName(`Hex Map - ${date}`);
    }
  });
  
  // Generate empty grid on first load if no map exists
  $effect(() => {
    if ($mapData.tiles.size === 0) {
      generateHexGrid();
    }
  });
  
  // Handle map name change
  function handleMapNameChange(e: Event) {
    const input = e.target as HTMLInputElement;
    setMapName(input.value);
  }
</script>

<div class="map-editor">
  <header class="header">
    <div class="map-title">
      <input 
        type="text" 
        class="map-name-input" 
        value={$mapData.mapName} 
        onchange={handleMapNameChange}
        placeholder="Untitled Map"
      />
    </div>
    
    <div class="header-buttons">
      <button class="header-button" onclick={handleImport}>
        <span class="button-icon">📂</span>
        <span class="button-text">Import</span>
      </button>
      
      <button class="header-button" onclick={handleExport}>
        <span class="button-icon">💾</span>
        <span class="button-text">Export</span>
      </button>
      
      <button class="header-button" onclick={handleLoadDemo}>
        <span class="button-icon">🗺️</span>
        <span class="button-text">Load Demo</span>
      </button>
    </div>
  </header>
  
  <main class="main-content">
    <aside class="sidebar">
      <Toolbar />
    </aside>
    
    <div class="map-container">
      <MapCanvas />
    </div>
  </main>
  
  <!-- Modals -->
  <POIModal />
  <RegionModal />
</div>

<style>
  .map-editor {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    background-color: #1a1a1a;
    color: white;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #2a2a2a;
    border-bottom: 1px solid #333;
  }
  
  .map-title {
    display: flex;
    align-items: center;
  }
  
  .map-name-input {
    background-color: transparent;
    border: 1px solid transparent;
    color: white;
    font-size: 1.25rem;
    font-weight: bold;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
  }
  
  .map-name-input:hover, .map-name-input:focus {
    background-color: #333;
    border-color: #444;
    outline: none;
  }
  
  .header-buttons {
    display: flex;
    gap: 0.5rem;
  }
  
  .header-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #333;
    border: none;
    border-radius: 0.25rem;
    color: white;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .header-button:hover {
    background-color: #444;
  }
  
  .button-icon {
    font-size: 1.25rem;
  }
  
  .main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  
  .sidebar {
    width: 250px;
    padding: 1rem;
    overflow-y: auto;
    border-right: 1px solid #333;
  }
  
  .map-container {
    flex: 1;
    overflow: hidden;
  }
</style>
