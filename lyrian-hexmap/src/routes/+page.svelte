<script lang="ts">
  import { onMount } from 'svelte';
  import MapCanvas from '$lib/components/MapCanvas.svelte';
  import Toolbar from '$lib/components/Toolbar.svelte';
  import AssetPalette from '$lib/components/AssetPalette.svelte';
  import ImportExportModal from '$lib/components/ImportExportModal.svelte';
  import NewMapModal from '$lib/components/NewMapModal.svelte';
  import POIEditModal from '$lib/components/POIEditModal.svelte';
  import RegionEditModal from '$lib/components/RegionEditModal.svelte';
  
  import { mapStore } from '$lib/stores/mapStore';
  import { historyStore } from '$lib/stores/historyStore';
  
  // Initialize the map on component mount
  onMount(() => {
    // Initialize with default dimensions if no map exists yet
    // This could be enhanced to load from localStorage in the future
    mapStore.initMap(20, 15, 'New Hex Map');
    historyStore.pushState('Initial map created');
    historyStore.markSaved();
  });
  
  // Handle beforeunload event to warn about unsaved changes
  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (historyStore.hasUnsavedChanges()) {
      event.preventDefault();
      event.returnValue = '';
      return '';
    }
    return undefined;
  }
  
  // Set up beforeunload handler
  onMount(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  });
</script>

<svelte:head>
  <title>Hex Map Editor</title>
</svelte:head>

<div class="app-container">
  <header class="app-header">
    <h1>Hex Map Editor</h1>
  </header>
  
  <Toolbar />
  
  <div class="main-content">
    <div class="canvas-container">
      <MapCanvas />
    </div>
    
    <div class="sidebar">
      <AssetPalette />
    </div>
  </div>
  
  <!-- Modals -->
  <ImportExportModal />
  <NewMapModal />
  <POIEditModal />
  <RegionEditModal />
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: #f9f9f9;
    color: #333;
  }
  
  :global(*, *::before, *::after) {
    box-sizing: border-box;
  }
  
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }
  
  .app-header {
    background-color: #333;
    color: white;
    padding: 10px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 500;
  }
  
  .main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  
  .canvas-container {
    flex: 1;
    overflow: hidden;
  }
  
  .sidebar {
    width: 250px;
    overflow: hidden;
  }
  
  @media (max-width: 768px) {
    .main-content {
      flex-direction: column;
    }
    
    .sidebar {
      width: 100%;
      height: 250px;
    }
  }
</style>
