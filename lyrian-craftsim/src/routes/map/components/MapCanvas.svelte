<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Container } from 'glixy';
  import HexTile from './HexTile.svelte';
  import POIMarker from './POIMarker.svelte';
  import RegionOutline from './RegionOutline.svelte';
  import { mapData, exportMapJSON, importMapJSON, generateHexGrid } from '$lib/map/stores/mapStore';
  import type { Tile } from '$lib/map/stores/mapStore';
  import { uiStore, updateCameraOffset, updateCameraZoom, showModal } from '$lib/map/stores/uiStore';
  import { isometricPointToHexKey, hexToIsometric, getHexCoordinatesFromKey } from '$lib/map/utils/hexlib';
  
  // Canvas and container references
  let canvasContainer: HTMLDivElement;
  let isDragging = false;
  let lastPos = { x: 0, y: 0 };
  
  // Handle pan interaction
  function handleMouseDown(e: MouseEvent) {
    // Only start panning with middle mouse or Alt+left click
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isDragging = true;
      lastPos = { x: e.clientX, y: e.clientY };
      canvasContainer.style.cursor = 'grabbing';
      e.preventDefault();
    }
  }
  
  function handleMouseMove(e: MouseEvent) {
    if (!isDragging) return;
    
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    
    updateCameraOffset(
      $uiStore.cameraOffset.x + dx,
      $uiStore.cameraOffset.y + dy
    );
    
    lastPos = { x: e.clientX, y: e.clientY };
  }
  
  function handleMouseUp() {
    if (isDragging) {
      isDragging = false;
      canvasContainer.style.cursor = 'default';
    }
  }
  
  // Handle zoom interaction
  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    
    const zoomSpeed = 0.1;
    const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
    const newZoom = $uiStore.cameraZoom + delta;
    
    updateCameraZoom(newZoom);
  }
  
  // Handle canvas click for tile selection
  function handleCanvasClick(e: MouseEvent) {
    if (isDragging) return;
    
    const rect = canvasContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert to world space
    const worldX = (x - $uiStore.cameraOffset.x) / $uiStore.cameraZoom;
    const worldY = (y - $uiStore.cameraOffset.y) / $uiStore.cameraZoom;
    
    // Find hex at click position
    const hexKey = isometricPointToHexKey(worldX, worldY);
    
    if (hexKey && $mapData.tiles.has(hexKey)) {
      // Handle click based on current tool
      handleHexClick(hexKey);
    }
  }
  
  // Handle click on a hex tile
  function handleHexClick(hexKey: string) {
    const tile = $mapData.tiles.get(hexKey);
    if (!tile) return;
    
    const { q, r } = tile;
    
    switch ($uiStore.currentTool) {
      case 'biome':
        // Update biome to the selected biome
        $mapData.tiles.get(hexKey)!.biome = $uiStore.selectedBiome;
        $mapData = $mapData; // Trigger reactivity
        break;
      
      case 'height':
        // Update height to the selected height
        $mapData.tiles.get(hexKey)!.height = $uiStore.selectedHeight;
        $mapData = $mapData; // Trigger reactivity
        break;
      
      case 'poi':
        // Show POI modal for this tile
        showModal({
          type: 'poi',
          tileKey: hexKey,
          editingPOI: tile.pois.length > 0 ? tile.pois[0] : undefined
        });
        break;
      
      case 'select':
        // Already handled by HexTile component
        break;
      
      case 'region':
        // Already handled by HexTile component
        break;
      
      case 'resize':
        // Expand the map (simplified for now)
        if (!$mapData.tiles.has(hexKey)) {
          const coords = getHexCoordinatesFromKey(hexKey);
          $mapData.tiles.set(hexKey, {
            q: coords[0],
            r: coords[1],
            biome: $uiStore.selectedBiome,
            height: 0,
            pois: []
          });
          $mapData = $mapData; // Trigger reactivity
        }
        break;
    }
  }
  
  // Setup event listeners
  onMount(() => {
    // Initialize map if needed
    if ($mapData.tiles.size === 0) {
      generateHexGrid(5);
    }
    
    // Add event listeners
    canvasContainer.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvasContainer.addEventListener('wheel', handleWheel);
    canvasContainer.addEventListener('click', handleCanvasClick);
    
    return () => {
      // Clean up event listeners
      canvasContainer.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvasContainer.removeEventListener('wheel', handleWheel);
      canvasContainer.removeEventListener('click', handleCanvasClick);
    };
  });
  
  // Convert map data to array for rendering
  $: tileArray = Array.from($mapData.tiles.entries()).map(([key, tile]) => {
    return { key, ...tile };
  });
  
  // Find current hovered/selected states
  $: getHoveredState = (q: number, r: number) => {
    return $uiStore.hoveredTile && 
           $uiStore.hoveredTile.q === q && 
           $uiStore.hoveredTile.r === r;
  };
  
  $: getSelectedState = (q: number, r: number) => {
    return $uiStore.selectedTiles.some(tile => tile.q === q && tile.r === r);
  };
  
  // Find region for a tile
  $: getRegionForTile = (q: number, r: number) => {
    return Array.from($mapData.regions.values()).find(region => 
      region.tiles.some(([rq, rr]) => rq === q && rr === r)
    );
  };
  
  // Determine if a region is hovered
  function isRegionHovered(regionId: string): boolean {
    return $uiStore.hoveredRegion === regionId ? true : false;
  }
</script>

<!-- Main map container -->
<div 
  class="map-canvas-container" 
  bind:this={canvasContainer}
>
  <!-- Transform container for pan/zoom -->
  <div 
    class="transform-container"
    style:transform="translate({$uiStore.cameraOffset.x}px, {$uiStore.cameraOffset.y}px) scale({$uiStore.cameraZoom})"
  >
    <!-- Region outlines -->
    {#each Array.from($mapData.regions.values()) as region}
      <RegionOutline 
        regionId={region.id} 
        regionName={region.name} 
        regionColor={region.color} 
        tiles={region.tiles} 
        isHovered={isRegionHovered(region.id)}
      />
    {/each}
    
    <!-- Render tiles with visual sorting for isometric view -->
    {#each tileArray.sort((a, b) => {
      // Back to front rendering (sort by r then q)
      if (a.r !== b.r) return a.r - b.r;
      return a.q - b.q;
    }) as tile (tile.key)}
      <HexTile
        q={tile.q}
        r={tile.r}
        biome={tile.biome}
        height={tile.height}
        pois={tile.pois}
        tileKey={tile.key}
        isSelected={getSelectedState(tile.q, tile.r)}
        isHovered={getHoveredState(tile.q, tile.r)}
      />
    {/each}
  </div>
</div>

<style>
  .map-canvas-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    background-color: #222;
  }
  
  .transform-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform-origin: center;
    will-change: transform;
  }
</style>
