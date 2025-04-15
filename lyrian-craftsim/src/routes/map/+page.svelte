<script lang="ts">
  import MapCanvas from './components/MapCanvas.svelte';
  import Toolbar from './components/Toolbar.svelte';
  import { mapData, exportMapJSON, importMapJSON, setMapName, loadDemoMap, generateHexGrid } from '$lib/map/stores/mapStore';
  import { routesData, exportRoutesJSON, importRoutesJSON } from '$lib/map/stores/routeStore';
  import { validateAndSanitizeMapJSON, VALIDATION_LIMITS } from '$lib/map/utils/secureImport';
  import '$lib/styles/map-specific.css';
  
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
      
      // Check file size limit before processing
      if (file.size > VALIDATION_LIMITS.MAX_FILE_SIZE_BYTES) {
        alert(`File too large. Maximum allowed size is ${VALIDATION_LIMITS.MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`);
        return;
      }
      
      // Check MIME type to ensure it's a text file
      if (!file.type.match('application/json') && 
          !file.type.match('text/plain') && 
          !file.type.match('text/')) {
        alert('Invalid file type. Only JSON and text files are supported.');
        return;
      }
      
      // Read the file
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        try {
          // Parse the JSON
          const rawJsonData = JSON.parse(readerEvent.target?.result as string);
          
          // Validate and sanitize the data
          const validationResult = validateAndSanitizeMapJSON(rawJsonData, file.size);
          
          if (!validationResult.isValid) {
            alert(`Failed to import map: ${validationResult.error}`);
            return;
          }
          
          // Import the sanitized data
          const success = importMapJSON(validationResult.sanitizedData);
          
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
      
      reader.onerror = () => {
        alert('Error reading file. Please try again with a different file.');
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
  
  <!-- No Modals here - they're now included in MapCanvas -->
</div>

<style>
  /* Additional map styles can go here if needed */
  .header-buttons {
    display: flex;
    gap: 0.5rem;
  }
</style>
