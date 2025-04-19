<script lang="ts">
  import { mapStore } from '$lib/stores/mapStore';
  import { selectedTile } from '$lib/stores/tileStore';
  import type { TileInfo } from '$lib/types';
  
  // State for tile size
  let tileSize = $state(256); 
  let scale = $state(1.0);
  
  // Grid container ref
  let container: HTMLDivElement;
  
  // Map dragging state
  let isDragging = $state(false);
  let lastX = $state(0);
  let lastY = $state(0);
  let offsetX = $state(0);
  let offsetY = $state(0);
  
  // When a cell is clicked or dragged over
  function handleCellClick(x: number, y: number) {
    if ($selectedTile) {
      addTileToCell(x, y, $selectedTile);
    }
  }
  
  // Add a tile to a cell
  function addTileToCell(x: number, y: number, tile: TileInfo) {
    if (x >= 0 && x < $mapStore.width && y >= 0 && y < $mapStore.height) {
      mapStore.addTile(x, y, tile.id);
    }
  }
  
  // Right-click to remove tiles
  function handleContextMenu(event: MouseEvent, x: number, y: number) {
    event.preventDefault();
    mapStore.clearCell(x, y);
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
          class="grid-cell"
          style="width: {tileSize}px; height: {tileSize}px; left: {x * tileSize}px; top: {y * tileSize}px;"
          onclick={() => handleCellClick(x, y)}
          oncontextmenu={(e) => handleContextMenu(e, x, y)}
        >
          <!-- Display tiles in this cell -->
          {#if $mapStore.cells[`${x},${y}`]}
            {#each $mapStore.cells[`${x},${y}`].tiles as tileId}
              <img 
                src={tileId} 
                alt="Tile" 
                class="cell-tile"
                draggable="false"
              />
            {/each}
          {/if}
          
          <!-- Display cell coordinates for debugging -->
          <div class="cell-coordinates">
            {x},{y}
          </div>
        </div>
      {/each}
    {/each}
  </div>
  
  <!-- Zoom indicator -->
  <div class="zoom-indicator">
    Zoom: {(scale * 100).toFixed(0)}%
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
  }
  
  .grid-inner {
    position: absolute;
  }
  
  .grid-cell {
    position: absolute;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    background-color: white;
  }

  .grid-cell:hover {
    outline: 2px solid rgb(59 130 246); /* blue-500 color */
    outline-offset: -2px;
    z-index: 10;
  }
  
  .cell-tile {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
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
  
  .zoom-indicator {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
  }
</style>