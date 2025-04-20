<script lang="ts">
  import { mapStore } from '$lib/stores/mapStore';
  import { selectedTile } from '$lib/stores/tileStore';
  import { tileSize, verticalTileSize } from '$lib/stores/gridStore';
  import type { TileInfo } from '$lib/types';
  import '$lib/styles/map-grid.css';
  
  // Store for the currently selected layer (add this in tileStore.ts later)
  import { writable } from 'svelte/store';
  export const selectedLayer = writable<string | null>(null);
  
  // Original PNG tile size (from readme)
  const originalTileSize = 256;
  // Optimal vertical spacing for hex tiles (exactly 2/3 of 256px)
  const optimalVerticalSpacing = 171;
  
  // State for scale - using $state for reactivity
  let scale = $state(1.0);
  
  // Grid container ref
  let container: HTMLDivElement;
  
  // Map dragging state - using $state for reactivity
  let isDragging = $state(false);
  let lastX = $state(0);
  let lastY = $state(0);
  let offsetX = $state(0);
  let offsetY = $state(0);
  
  // Cache for tile metadata to avoid redundant fetch requests
  const tileMetadataCache = new Map<string, {width: number, height: number, isSmall: boolean}>();
  
  // Common layers - base, terrain features, structures
  const layers = ['base', 'terrain', 'structures', 'decoration'];
  
  // When a cell is clicked
  function handleCellClick(x: number, y: number) {
    if ($selectedTile) {
      addTileToCell(x, y, $selectedTile);
    }
  }
  
  // Add a tile to a cell
  function addTileToCell(x: number, y: number, tile: TileInfo) {
    if (x >= 0 && x < $mapStore.width && y >= 0 && y < $mapStore.height) {
      // Add tile metadata to cache for future reference when rendering
      if (tile.width && tile.height) {
        tileMetadataCache.set(tile.id, {
          width: tile.width,
          height: tile.height,
          isSmall: tile.isSmall || false
        });
      }
      
      // Use the current layer or default to base
      const layer = $selectedLayer || 'base';
      mapStore.addTile(x, y, tile.id);
    }
  }
  
  // Right-click to remove tiles from the current layer
  function handleContextMenu(event: MouseEvent, x: number, y: number) {
    event.preventDefault();
    if ($selectedLayer) {
      // Since removeTileFromLayer doesn't exist, we'll use regular removeTile
      mapStore.clearCell(x, y);
    } else {
      mapStore.clearCell(x, y);
    }
    return false; // Prevent default context menu
  }
  
  // Start map dragging
  function startDrag(event: MouseEvent) {
    if (event.button !== 1) return; // Only middle mouse button
    
    isDragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    event.preventDefault();
  }
  
  // Handle map dragging
  function handleDrag(event: MouseEvent) {
    if (!isDragging) return;
    
    const deltaX = event.clientX - lastX;
    const deltaY = event.clientY - lastY;
    
    offsetX += deltaX;
    offsetY += deltaY;
    
    lastX = event.clientX;
    lastY = event.clientY;
  }
  
  // End map dragging
  function endDrag() {
    isDragging = false;
  }
  
  // Zoom handling
  function handleWheel(event: WheelEvent) {
    event.preventDefault();
    
    // Calculate zoom
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.2, Math.min(2, scale + delta));
    
    if (newScale !== scale) {
      // Calculate mouse position relative to container
      const rect = container.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      // Calculate how much the content will change size
      const scaleFactor = newScale / scale;
      
      // Adjust offset to zoom toward mouse position
      offsetX = mouseX - (mouseX - offsetX) * scaleFactor;
      offsetY = mouseY - (mouseY - offsetY) * scaleFactor;
      
      scale = newScale;
    }
  }
  
  // Prevent context menu for the entire grid container
  function preventContextMenu(event: MouseEvent) {
    event.preventDefault();
    return false;
  }
  
  // Calculate position offset for image in cell
  function calculatePositionStyle(tileId: string): string {
    const metadata = tileMetadataCache.get(tileId);
    
    if (metadata && metadata.isSmall) {
      // For small tiles, center them in the tile space
      const horizontalOffset = Math.floor((originalTileSize - metadata.width) / 2);
      
      // For vertical offset, we need to:
      // 1. Start at optimalVerticalSpacing - originalTileSize (the standard offset)
      // 2. Add half the difference between originalTileSize and the image height
      const baseOffset = optimalVerticalSpacing - originalTileSize;
      const centeringOffset = Math.floor((originalTileSize - metadata.height) / 2);
      const verticalOffset = baseOffset + centeringOffset;
      
      return `left: ${horizontalOffset}px; top: ${verticalOffset}px; width: ${metadata.width}px; height: ${metadata.height}px;`;
    }
    
    // For regular tiles, use the standard vertical offset to align the bottom edge
    return `left: 0px; top: ${optimalVerticalSpacing - originalTileSize}px; width: ${originalTileSize}px; height: ${originalTileSize}px;`;
  }
  
  // Get tiles for a specific cell
  function getTilesByLayer(x: number, y: number) {
    const cellKey = `${x},${y}`;
    const cell = $mapStore.cells[cellKey];
    if (!cell) return {};
    
    // Since we don't have layers in our cell structure yet, return a simple object
    return { base: cell.tiles || [] };
  }
  
  // Check if an image is a small decoration that should be centered
  function isSmallTile(tileId: string): boolean {
    const metadata = tileMetadataCache.get(tileId);
    if (metadata) {
      return metadata.isSmall;
    }
    
    // If no metadata yet, use heuristics based on filename
    return tileId.toLowerCase().includes('decoration') || 
           tileId.toLowerCase().includes('house');
  }
  
  // Reset the view to center
  function resetView() {
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    offsetX = rect.width / 2 - ($mapStore.width * originalTileSize * scale) / 2;
    offsetY = rect.height / 2 - ($mapStore.height * optimalVerticalSpacing * scale) / 2;
    scale = 1.0;
  }
  
  // Helper function to get a color for each layer
  function getLayerColor(layer: string): string {
    const colors: Record<string, string> = {
      base: 'rgba(59, 130, 246, 0.7)', // blue
      terrain: 'rgba(16, 185, 129, 0.7)', // green
      structures: 'rgba(245, 158, 11, 0.7)', // amber
      decoration: 'rgba(139, 92, 246, 0.7)', // purple
    };
    
    return colors[layer] || 'rgba(0, 0, 0, 0.5)';
  }
  
  // Fetch and store image dimensions when a new tile is added
  function fetchTileMetadata(tileId: string): void {
    // If already in cache, don't fetch again
    if (tileMetadataCache.has(tileId)) return;
    
    // Create a hidden image element to load the image and get its dimensions
    const img = new Image();
    img.onload = () => {
      const isSmall = img.width < 200 || img.height < 200;
      tileMetadataCache.set(tileId, {
        width: img.width,
        height: img.height,
        isSmall
      });
    };
    img.src = tileId;
  }
  
  // When the map store changes, fetch metadata for any new tiles
  $effect(() => {
    for (const cell of Object.values($mapStore.cells)) {
      for (const tileId of cell.tiles) {
        if (!tileMetadataCache.has(tileId)) {
          fetchTileMetadata(tileId);
        }
      }
    }
  });
</script>

<div 
  class="grid-container"
  bind:this={container}
  onmousedown={startDrag}
  onmousemove={handleDrag}
  onmouseup={endDrag}
  onmouseleave={endDrag}
  onwheel={handleWheel}
  oncontextmenu={preventContextMenu}
>
  <div 
    class="grid-inner"
    style="transform: translate({offsetX}px, {offsetY}px) scale({scale}); transform-origin: 0 0;"
  >
    <!-- Generate grid cells -->
    {#each Array($mapStore.height) as _, y}
      {#each Array($mapStore.width) as _, x}
        <div 
          class="grid-cell {$selectedTile ? 'paintable' : ''}"
          style="width: {originalTileSize}px; height: {optimalVerticalSpacing}px; left: {x * originalTileSize}px; top: {y * optimalVerticalSpacing}px;"
          onclick={() => handleCellClick(x, y)}
          oncontextmenu={(e) => handleContextMenu(e, x, y)}
          data-x={x}
          data-y={y}
        >
          <!-- Display tiles in this cell by layer -->
          {#if $mapStore.cells[`${x},${y}`]}
            {#each Object.entries(getTilesByLayer(x, y)) as [layer, tiles]}
              {#each tiles as tileId (tileId)}
                <img 
                  src={tileId} 
                  alt={`${layer} tile`} 
                  class="cell-tile {isSmallTile(tileId) ? 'small-tile' : ''}"
                  data-layer={layer}
                  style={calculatePositionStyle(tileId)}
                  draggable="false"
                />
              {/each}
            {/each}
          {/if}
          
          <!-- Display cell coordinates -->
          <div class="cell-coordinates">
            {x},{y}
          </div>
          
          <!-- Highlight if in active layer - disabled for now until we implement layers fully -->
          <!-- {#if $selectedLayer && $mapStore.cells[`${x},${y}`]?.layers && $mapStore.cells[`${x},${y}`].layers[$selectedLayer]?.length > 0}
            <div class="layer-indicator" style="background-color: {getLayerColor($selectedLayer)}"></div>
          {/if} -->
        </div>
      {/each}
    {/each}
  </div>
  
  <!-- Controls -->
  <div class="map-controls">
    <button class="control-button" onclick={resetView} title="Reset View">
      🔍
    </button>
    <div class="zoom-indicator">
      Zoom: {(scale * 100).toFixed(0)}% | Size: 256px × 171px
    </div>
    <div class="layer-indicators">
      {#each layers as layer}
        <div 
          class="layer-button {$selectedLayer === layer ? 'active' : ''}"
          style="border-color: {getLayerColor(layer)}"
          onclick={() => ($selectedLayer = layer)}
        >
          {layer}
        </div>
      {/each}
    </div>
  </div>
</div>