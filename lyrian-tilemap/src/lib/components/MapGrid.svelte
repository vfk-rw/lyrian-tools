<script lang="ts">
  import { mapStore } from '$lib/stores/mapStore';
  import { selectedTile } from '$lib/stores/tileStore';
  import { tileSize, verticalTileSize } from '$lib/stores/gridStore';
  import type { TileInfo } from '$lib/types';
  
  // Store for the currently selected layer (add this in tileStore.ts later)
  import { writable } from 'svelte/store';
  export const selectedLayer = writable<string | null>(null);
  
  // Original PNG tile size (from readme)
  const originalTileSize = 256;
  // Optimal vertical spacing for hex tiles (exactly 2/3 of 256px)
  const optimalVerticalSpacing = 171;
  
  // State for scale
  let scale = 1.0;
  
  // Grid container ref
  let container: HTMLDivElement;
  
  // Map dragging state
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  let offsetX = 0;
  let offsetY = 0;
  
  // Tile placement mode
  let isPlacingTiles = false;
  let lastPlacedX = -1;
  let lastPlacedY = -1;
  
  // Common layers - base, terrain features, structures
  const layers = ['base', 'terrain', 'structures', 'decoration'];
  
  // When a cell is clicked or dragged over
  function handleCellClick(x: number, y: number) {
    if ($selectedTile) {
      addTileToCell(x, y, $selectedTile);
      // Start tile placement mode for drag-to-place
      isPlacingTiles = true;
      lastPlacedX = x;
      lastPlacedY = y;
    }
  }
  
  // Handle mouse over cell during tile placement
  function handleCellOver(x: number, y: number) {
    if (isPlacingTiles && $selectedTile && (x !== lastPlacedX || y !== lastPlacedY)) {
      addTileToCell(x, y, $selectedTile);
      lastPlacedX = x;
      lastPlacedY = y;
    }
  }
  
  // End tile placement mode
  function endTilePlacement() {
    isPlacingTiles = false;
    lastPlacedX = -1;
    lastPlacedY = -1;
  }
  
  // Add a tile to a cell
  function addTileToCell(x: number, y: number, tile: TileInfo) {
    if (x >= 0 && x < $mapStore.width && y >= 0 && y < $mapStore.height) {
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
    endTilePlacement();
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
  function calculateHorizontalOffset(): string {
    // Center horizontally
    return '0px';
  }
  
  // Calculate vertical position offset for image in cell
  // We align the bottom of the PNG with the bottom of the grid cell
  function calculateVerticalOffset(): string {
    // originalTileSize (256) - optimalVerticalSpacing (171) = 85px offset from top
    // This will align the bottom of the 256px tall PNG with the bottom of the 171px tall grid cell
    return `${optimalVerticalSpacing - originalTileSize}px`;
  }
  
  // Get tiles for a specific cell
  function getTilesByLayer(x: number, y: number) {
    const cellKey = `${x},${y}`;
    const cell = $mapStore.cells[cellKey];
    if (!cell) return {};
    
    // Since we don't have layers in our cell structure yet, return a simple object
    return { base: cell.tiles || [] };
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
          class="grid-cell {$selectedTile ? 'placing-mode' : ''}"
          style="width: {originalTileSize}px; height: {optimalVerticalSpacing}px; left: {x * originalTileSize}px; top: {y * optimalVerticalSpacing}px;"
          onclick={() => handleCellClick(x, y)}
          onmouseover={() => handleCellOver(x, y)}
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
                  class="cell-tile"
                  data-layer={layer}
                  style="left: {calculateHorizontalOffset()}; top: {calculateVerticalOffset()};" 
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

<style>
  /* Regular CSS without Tailwind import */
  .grid-container {
    position: relative;
    width: 100%;
    height: 100%;
    background-color: #f3f4f6;
    overflow: hidden;
    user-select: none;
  }
  
  .grid-inner {
    position: absolute;
  }
  
  .grid-cell {
    position: absolute;
    overflow: visible; /* Changed from hidden to visible */
    border: 1px solid rgba(229, 231, 235, 0.4); /* Made border semi-transparent */
    background-color: transparent; 
  }

  .grid-cell:hover {
    outline: 2px solid rgb(59 130 246); /* blue-500 color */
    outline-offset: -2px;
    z-index: 10;
  }
  
  .placing-mode:hover {
    cursor: pointer;
    outline: 2px solid rgb(34 197 94); /* green-500 */
  }
  
  .cell-tile {
    position: absolute;
    width: 256px;
    height: 256px;
    pointer-events: none;
  }
  
  .cell-coordinates {
    position: absolute;
    bottom: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.3);
    color: white;
    font-size: 0.75rem;
    padding: 0.25rem;
  }
  
  .layer-indicator {
    position: absolute;
    top: 0;
    right: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    opacity: 0.7;
  }
  
  .map-controls {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-end;
  }
  
  .zoom-indicator {
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }
  
  .control-button {
    background-color: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.25rem;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    font-size: 1rem;
  }
  
  .layer-indicators {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  
  .layer-button {
    background-color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    cursor: pointer;
    border: 2px solid transparent;
  }
  
  .layer-button.active {
    background-color: #f3f4f6;
    font-weight: bold;
  }
</style>