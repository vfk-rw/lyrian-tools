<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { mapStore, getTileKey } from '$lib/stores/mapStore';
  import { uiStore, EditMode } from '$lib/stores/uiStore';
  import { historyStore } from '$lib/stores/historyStore';
  import { createGrid, pointToHex, type HexType } from '$lib/hexUtils/hexUtils';
  import { getHexAssetById, loadHexAssets, type HexAssetCategory, type HexAsset } from '$lib/hexUtils/assets';
  import type { Grid } from 'honeycomb-grid';

  // Canvas element reference
  let canvasElement: HTMLCanvasElement;
  let canvasContext: CanvasRenderingContext2D | null;
  let grid: Grid<HexType>;
  
  // Asset categories for hex tiles
  let assetCategories: HexAssetCategory[] = [];
  
  // Cached image assets for rendering
  const imageCache = new Map<string, HTMLImageElement>();
  
  // Hex grid dimensions
  let width = $mapStore.width;
  let height = $mapStore.height;
  
  // Canvas dimensions and rendering state
  let canvasWidth = 0;
  let canvasHeight = 0;
  let isMouseDown = false;
  let lastPaintedHexKey: string | null = null;
  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  
  // Fine-tuning sliders for hex alignment
  let hexSizeAdjust = 138; // Base hex size
  let xOffset = -2; // X offset for hex image positioning
  let yOffset = -4; // Y offset for hex image positioning
  let hexImageSize = 256; // Hex image size
  let xGap = 0; // Gap between tiles in X direction
  let yGap = 0; // Gap between tiles in Y direction
  let showAlignmentTools = false;
  
  // Track if loading images is still in progress
  let isLoadingImages = false;
  
  // Mouse position in canvas coordinates (for debugging)
  let mouseX = 0;
  let mouseY = 0;
  let hoveredHexKey: string | null = null;
  
  // Animation frame ID for rendering loop
  let animationFrameId: number;

  // Initialize grid based on map dimensions and current projection angle
  $: {
    width = $mapStore.width;
    height = $mapStore.height;
    // Use the adjusted hex size and projection angle for grid creation
    grid = createGrid(width, height, $uiStore.hexProjectionAngle, hexSizeAdjust);
  }
  
  // Function to change projection
  function setProjection(angle: number) {
    uiStore.setHexProjectionAngle(angle);
  }
  
  // Toggle alignment tools visibility
  function toggleAlignmentTools() {
    showAlignmentTools = !showAlignmentTools;
  }
  
  // Load hex assets
  onMount(async () => {
    // Load asset categories
    assetCategories = await loadHexAssets();
  });
  
  // Create and cache image from asset URL
  function getImageForAsset(assetId: string): HTMLImageElement | null {
    if (!assetId) return null;
    
    const asset = getHexAssetById(assetCategories, assetId);
    if (!asset) return null;
    
    if (imageCache.has(assetId)) {
      return imageCache.get(assetId) || null;
    }
    
    // Load the image
    const img = new Image();
    img.src = asset.path;
    imageCache.set(assetId, img);
    isLoadingImages = true;
    
    // Set loading state when image loads
    img.onload = () => {
      isLoadingImages = false;
    };
    
    return img;
  }
  
  // Initialize the canvas when component mounts
  onMount(() => {
    if (!canvasElement) return;
    
    canvasContext = canvasElement.getContext('2d');
    if (!canvasContext) return;
    
    // Start render loop
    startRenderLoop();
    
    // Handle window resize
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    
    resizeObserver.observe(canvasElement.parentElement || document.body);
    updateCanvasSize();
    
    return () => {
      resizeObserver.disconnect();
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  });
  
  // Update canvas size to match parent container
  function updateCanvasSize() {
    if (!canvasElement || !canvasElement.parentElement) return;
    
    const rect = canvasElement.parentElement.getBoundingClientRect();
    canvasWidth = rect.width;
    canvasHeight = rect.height;
    
    canvasElement.width = canvasWidth;
    canvasElement.height = canvasHeight;
  }
  
  // Start the rendering loop
  function startRenderLoop() {
    const render = () => {
      renderCanvas();
      animationFrameId = requestAnimationFrame(render);
    };
    
    render();
  }
  
  // Handle cleaning up on component destroy
  onDestroy(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  });
  
  // Main canvas rendering function
  function renderCanvas() {
    if (!canvasContext || !grid) return;
    
    // Clear the canvas
    canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
    canvasContext.fillStyle = '#f0f0f0';
    canvasContext.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Set up transform
    canvasContext.save();
    canvasContext.translate(canvasWidth / 2 + $uiStore.panX, canvasHeight / 2 + $uiStore.panY);
    canvasContext.scale($uiStore.zoom, $uiStore.zoom);
    
    // Draw tiles
    for (const [key, tile] of $mapStore.tiles.entries()) {
      const hex = grid.getHex({ q: tile.q, r: tile.r });
      if (!hex) continue;
      
      // Apply gap adjustments to position
      // X and Y gaps are applied as a function of the hex coordinates
      // This ensures that tiles further from the origin have larger gaps
      const gapX = xGap * Math.abs(tile.q) / 1.25;
      const gapY = yGap * Math.abs(tile.r) / 1.25;
      
      // Apply gaps based on the direction from origin
      const gapDirX = tile.q >= 0 ? 1 : -1;
      const gapDirY = tile.r >= 0 ? 1 : -1;
      
      const { x, y } = hex; // Access x and y properties directly
      const adjustedX = x + (gapX * gapDirX);
      const adjustedY = y + (gapY * gapDirY);
      
      // Draw the tile image if available
      const img = getImageForAsset(tile.assetId);
      if (img && img.complete) {
        // Apply the adjusted offsets, gaps, and image size
        canvasContext.drawImage(
          img,
          adjustedX - hexImageSize / 2 + xOffset,
          adjustedY - hexImageSize / 2 + yOffset,
          hexImageSize,
          hexImageSize
        );
      }
      
      // Draw hex border if grid is enabled
      if ($uiStore.showGrid) {
        drawHexBorder(canvasContext, hex);
      }
      
      // Highlight selected tiles
      if ($mapStore.selectedTiles.has(key)) {
        highlightHex(canvasContext, hex, 'rgba(0, 162, 255, 0.3)');
      }
      
      // Highlight hovered hex
      if (hoveredHexKey === key) {
        highlightHex(canvasContext, hex, 'rgba(255, 255, 0, 0.3)');
      }
    }
    
    // Draw empty grid cells if grid is visible
    if ($uiStore.showGrid) {
      for (const hex of grid) {
        const key = getTileKey(hex.q, hex.r);
        if (!$mapStore.tiles.has(key)) {
          drawHexBorder(canvasContext, hex);
        }
      }
    }
    
    // Draw regions if enabled
    if ($uiStore.showRegions) {
      for (const [id, region] of $mapStore.regions.entries()) {
        const isSelected = id === $mapStore.selectedRegion;
        drawRegion(canvasContext, region.hexes, isSelected ? 'rgba(255, 100, 100, 0.5)' : 'rgba(255, 100, 100, 0.2)');
      }
    }
    
    // Draw POIs if enabled
    if ($uiStore.showPOIs) {
      for (const [id, poi] of $mapStore.pois.entries()) {
        const hex = grid.getHex({ q: poi.q, r: poi.r });
        if (hex) {
          const { x, y } = hex;
          
          const isSelected = id === $mapStore.selectedPOI;
          const color = isSelected ? '#ff0000' : '#0000ff';
          
          // Draw POI marker
          canvasContext.fillStyle = color;
          canvasContext.beginPath();
          canvasContext.arc(x, y, 10, 0, 2 * Math.PI);
          canvasContext.fill();
          
          // Draw POI name
          canvasContext.fillStyle = '#000000';
          canvasContext.font = '14px Arial';
          canvasContext.fillText(poi.name, x + 15, y);
        }
      }
    }
    
    canvasContext.restore();
  }
  
  // Draw a hex border
  function drawHexBorder(ctx: CanvasRenderingContext2D, hex: HexType) {
    const corners = hex.corners; // Access corners as a property, not a method
    
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(corners[5].x, corners[5].y);
    
    for (const { x, y } of corners) {
      ctx.lineTo(x, y);
    }
    
    ctx.closePath();
    ctx.stroke();
  }
  
  // Highlight a hex with a fill color
  function highlightHex(ctx: CanvasRenderingContext2D, hex: HexType, color: string) {
    const corners = hex.corners; // Access corners as a property, not a method
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(corners[5].x, corners[5].y);
    
    for (const { x, y } of corners) {
      ctx.lineTo(x, y);
    }
    
    ctx.closePath();
    ctx.fill();
  }
  
  // Draw a region as a group of hexes
  function drawRegion(ctx: CanvasRenderingContext2D, hexCoords: { q: number, r: number }[], color: string) {
    for (const { q, r } of hexCoords) {
      const hex = grid.getHex({ q, r });
      if (hex) {
        highlightHex(ctx, hex, color);
      }
    }
  }
  
  // Handle mouse down event
  function handleMouseDown(event: MouseEvent) {
    if (!grid) return;
    
    const rect = canvasElement.getBoundingClientRect();
    const x = (event.clientX - rect.left - canvasWidth / 2 - $uiStore.panX) / $uiStore.zoom;
    const y = (event.clientY - rect.top - canvasHeight / 2 - $uiStore.panY) / $uiStore.zoom;
    
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    isMouseDown = true;
    
    // Different behavior based on current mode
    switch ($uiStore.mode) {
      case EditMode.SELECT:
        isDragging = false;
        const hex = pointToHex(grid, x, y);
        if (hex) {
          const hexKey = getTileKey(hex.q, hex.r);
          
          // Handle selecting/deselecting
          if (event.shiftKey) {
            const newSelection = new Set($mapStore.selectedTiles);
            if (newSelection.has(hexKey)) {
              newSelection.delete(hexKey);
            } else {
              newSelection.add(hexKey);
            }
            mapStore.selectTiles([...newSelection]);
          } else {
            // Clear selection if clicking outside of current selection
            if (!$mapStore.selectedTiles.has(hexKey)) {
              mapStore.selectTiles([hexKey]);
            }
          }
        } else {
          // Clicked empty space, clear selection
          if (!event.shiftKey) {
            mapStore.clearSelection();
          }
        }
        break;
        
      case EditMode.PAINT:
        if ($uiStore.selectedAssetId) {
          const hex = pointToHex(grid, x, y);
          if (hex) {
            lastPaintedHexKey = getTileKey(hex.q, hex.r);
            mapStore.setTile(hex.q, hex.r, $uiStore.selectedAssetId);
            historyStore.pushState('Paint tile');
          }
        }
        break;
        
      case EditMode.ERASE:
        const eraseHex = pointToHex(grid, x, y);
        if (eraseHex) {
          lastPaintedHexKey = getTileKey(eraseHex.q, eraseHex.r);
          mapStore.removeTile(eraseHex.q, eraseHex.r);
          historyStore.pushState('Erase tile');
        }
        break;
        
      case EditMode.REGION:
        // Start creating a region
        break;
        
      case EditMode.POI:
        // Create a POI
        const poiHex = pointToHex(grid, x, y);
        if (poiHex) {
          mapStore.addPOI('New POI', '', poiHex.q, poiHex.r);
          historyStore.pushState('Add POI');
          uiStore.togglePOIEditModal();
        }
        break;
    }
  }
  
  // Handle mouse move event
  function handleMouseMove(event: MouseEvent) {
    if (!grid || !canvasElement) return;
    
    const rect = canvasElement.getBoundingClientRect();
    const rawX = event.clientX - rect.left;
    const rawY = event.clientY - rect.top;
    
    // Fix the Y coordinate calculation (was using panX instead of panY)
    const x = (rawX - canvasWidth / 2 - $uiStore.panX) / $uiStore.zoom;
    const y = (rawY - canvasHeight / 2 - $uiStore.panY) / $uiStore.zoom;
    
    // Update debug mouse coordinates
    mouseX = Math.round(x);
    mouseY = Math.round(y);
    
    // Find and update hovered hex
    const hex = pointToHex(grid, x, y);
    hoveredHexKey = hex ? getTileKey(hex.q, hex.r) : null;
    
    // Handle panning via middle mouse button or alt+drag
    if (isMouseDown && (event.buttons === 4 || event.altKey)) {
      isDragging = true;
      
      const dx = event.clientX - lastMouseX;
      const dy = event.clientY - lastMouseY;
      
      // Use the setPan method instead of direct assignment
      uiStore.setPan($uiStore.panX + dx, $uiStore.panY + dy);
      
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
      
      return;
    }
    
    // Handle active tool operations during drag
    if (isMouseDown) {
      switch ($uiStore.mode) {
        case EditMode.SELECT:
          // Handle drag selection (future feature)
          break;
          
        case EditMode.PAINT:
          if (!hex || !$uiStore.selectedAssetId) break;
          
          const hexKey = getTileKey(hex.q, hex.r);
          if (lastPaintedHexKey !== hexKey) {
            lastPaintedHexKey = hexKey;
            mapStore.setTile(hex.q, hex.r, $uiStore.selectedAssetId);
          }
          break;
          
        case EditMode.ERASE:
          if (!hex) break;
          
          const eraseKey = getTileKey(hex.q, hex.r);
          if (lastPaintedHexKey !== eraseKey) {
            lastPaintedHexKey = eraseKey;
            mapStore.removeTile(hex.q, hex.r);
          }
          break;
      }
    }
  }
  
  // Handle mouse up event
  function handleMouseUp() {
    isMouseDown = false;
    lastPaintedHexKey = null;
    
    // If we did a significant drag operation, record it in history
    if (isDragging && $uiStore.mode === EditMode.PAINT || $uiStore.mode === EditMode.ERASE) {
      historyStore.pushState($uiStore.mode === EditMode.PAINT ? 'Paint tiles' : 'Erase tiles');
    }
    
    isDragging = false;
  }
  
  // Handle mouse wheel for zoom
  function handleWheel(event: WheelEvent) {
    event.preventDefault();
    
    const zoomAmount = 0.1;
    const delta = event.deltaY > 0 ? -zoomAmount : zoomAmount;
    const newZoom = Math.max(0.1, Math.min(3, $uiStore.zoom + delta));
    
    // Calculate the point to zoom at (cursor position)
    const rect = canvasElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Calculate the zoom center relative to the canvas center
    const centerX = mouseX - canvasWidth / 2;
    const centerY = mouseY - canvasHeight / 2;
    
    // Calculate the pan adjustment to keep the point under the cursor stable
    const scaleFactor = newZoom / $uiStore.zoom;
    const dx = centerX - centerX * scaleFactor;
    const dy = centerY - centerY * scaleFactor;
    
    // Update zoom and pan using store methods
    uiStore.setZoom(newZoom);
    uiStore.setPan($uiStore.panX + dx, $uiStore.panY + dy);
  }

  // Function to update grid when hex size is changed
  function refreshGrid() {
    grid = createGrid(width, height, $uiStore.hexProjectionAngle, hexSizeAdjust);
  }
</script>

<div class="canvas-container">
  <canvas
    bind:this={canvasElement}
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:wheel={handleWheel}
    on:contextmenu|preventDefault
  ></canvas>
  
  <!-- Projection selector -->
  <div class="projection-selector">
    <div class="projection-label">Hex Projection:</div>
    <div class="projection-slider">
      <input 
        type="range" 
        min="0" 
        max="60" 
        step="1" 
        value={$uiStore.hexProjectionAngle} 
        on:input={(e) => uiStore.setHexProjectionAngle(Number(e.currentTarget.value))}
        title="Adjust projection angle (0-60 degrees)"
      />
      <span class="projection-value">{$uiStore.hexProjectionAngle}°</span>
    </div>
    
    <!-- Alignment tools toggle -->
    <button class="alignment-toggle" on:click={toggleAlignmentTools}>
      {showAlignmentTools ? 'Hide' : 'Show'} Alignment Tools
    </button>
  </div>
  
  <!-- Alignment fine-tuning sliders -->
  {#if showAlignmentTools}
    <div class="alignment-tools">
      <div class="slider-container">
        <label>Hex Size: {hexSizeAdjust}</label>
        <input type="range" min="100" max="180" step="1" bind:value={hexSizeAdjust} on:change={refreshGrid} />
      </div>
      
      <div class="slider-container">
        <label>X Offset: {xOffset}</label>
        <input type="range" min="-20" max="20" step="1" bind:value={xOffset} />
      </div>
      
      <div class="slider-container">
        <label>Y Offset: {yOffset}</label>
        <input type="range" min="-50" max="20" step="1" bind:value={yOffset} />
      </div>
      
      <div class="slider-container">
        <label>Image Size: {hexImageSize}</label>
        <input type="range" min="200" max="300" step="1" bind:value={hexImageSize} />
      </div>
      
      <div class="slider-container">
        <label>X Gap: {xGap}</label>
        <input type="range" min="-20" max="20" step="1" bind:value={xGap} />
      </div>
      
      <div class="slider-container">
        <label>Y Gap: {yGap}</label>
        <input type="range" min="-20" max="20" step="1" bind:value={yGap} />
      </div>
      
      <div class="alignment-values">
        <p>Current values: Size={hexSizeAdjust}, X={xOffset}, Y={yOffset}, ImgSize={hexImageSize}, XGap={xGap}, YGap={yGap}</p>
      </div>
    </div>
  {/if}
  
  <!-- Debug info overlay -->
  <div class="debug-info">
    <p>Mouse: {mouseX}, {mouseY}</p>
    <p>Hex: {hoveredHexKey || 'None'}</p>
    <p>Mode: {$uiStore.mode}</p>
    <p>Projection: {$uiStore.hexProjectionAngle}°</p>
    <p>Zoom: {$uiStore.zoom.toFixed(2)}</p>
  </div>
  
  <!-- Loading indicator -->
  {#if isLoadingImages}
    <div class="loading-indicator">Loading images...</div>
  {/if}
</div>

<style>
  /* Existing styles */
  .canvas-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  
  canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
  
  /* Alignment tools styles */
  .alignment-tools {
    position: absolute;
    top: 55px;
    left: 10px;
    background-color: rgba(255, 255, 255, 0.85);
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #ccc;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    z-index: 100;
    width: 280px;
  }
  
  .slider-container {
    margin-bottom: 10px;
  }
  
  .slider-container label {
    display: block;
    margin-bottom: 5px;
    font-size: 14px;
  }
  
  .slider-container input {
    width: 100%;
  }
  
  .alignment-values {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #ddd;
    font-size: 12px;
    font-family: monospace;
  }
  
  .alignment-values p {
    margin: 0;
  }
  
  .alignment-toggle {
    margin-left: 10px;
    padding: 4px 8px;
    font-size: 12px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  /* Projection slider styles */
  .projection-slider {
    display: flex;
    align-items: center;
    margin-right: 10px;
    gap: 8px;
  }
  
  .projection-slider input[type="range"] {
    width: 120px;
  }
  
  .projection-value {
    font-weight: bold;
    min-width: 30px;
  }

  /* Existing styles continued */
  .projection-selector {
    position: absolute;
    top: 10px;
    left: 10px;
    background-color: rgba(255, 255, 255, 0.7);
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 14px;
    display: flex;
    align-items: center;
  }

  .projection-label {
    margin-right: 10px;
  }

  .projection-options button {
    margin-right: 5px;
    padding: 5px 10px;
    border: none;
    background-color: #f0f0f0;
    cursor: pointer;
  }

  .projection-options button.active {
    background-color: #007bff;
    color: white;
  }
  
  .debug-info {
    position: absolute;
    bottom: 10px;
    left: 10px;
    background-color: rgba(255, 255, 255, 0.7);
    padding: 5px;
    border-radius: 4px;
    font-size: 12px;
    font-family: monospace;
  }
  
  .debug-info p {
    margin: 2px 0;
  }
  
  .loading-indicator {
    position: absolute;
    top: 10px;
    right: 10px;
    background-color: rgba(255, 255, 255, 0.7);
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 14px;
  }
</style>