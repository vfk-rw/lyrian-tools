<script lang="ts">
  import TileSelector from '$lib/components/TileSelector.svelte';
  import MapGrid from '$lib/components/MapGrid.svelte';
  import Toolbar from '$lib/components/Toolbar.svelte';
  import { initializeTileStore } from '$lib/stores/tileStore';
  import type { TileCategory } from '$lib/types';

  // Get data from server
  let { data } = $props<{ data: { categories: TileCategory[] } }>();

  // Initialize tile store with data from server
  $effect(() => {
    if (data?.categories) {
      initializeTileStore(data.categories);
    }
  });
</script>

<div class="app-container">
  <!-- Toolbar at the top -->
  <Toolbar />
  
  <!-- Main area with grid and selector -->
  <div class="main-content">
    <!-- Tile selector on the left -->
    <TileSelector />
    
    <!-- Map grid in the center/right -->
    <div class="map-container">
      <MapGrid />
    </div>
  </div>
</div>

<style>
  /* Regular CSS without Tailwind imports */
  .app-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
  
  .main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  
  .map-container {
    flex: 1;
  }
</style>
