<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import HexTile from './HexTile.svelte';
import POIMarker from './POIMarker.svelte';
import RegionOutline from './RegionOutline.svelte';
import RouteRenderer from './RouteRenderer.svelte';
import WaypointMarker from './WaypointMarker.svelte';
import RouteModal from './RouteModal.svelte';
import WaypointModal from './WaypointModal.svelte';
import POIModal from './POIModal.svelte';
import RegionModal from './RegionModal.svelte';
  import { mapData, exportMapJSON, importMapJSON, generateHexGrid, updateTileIcon } from '$lib/map/stores/mapStore';
  import { routesData, activeEditRoute, getRouteLengthInDays } from '$lib/map/stores/routeStore';
  import type { Tile, Region } from '$lib/map/stores/mapStore';
  import { uiStore, updateCameraOffset, updateCameraZoom, showModal, type RegionHoverInfo } from '$lib/map/stores/uiStore';
  import { hexToPixel, getHexesInRange, pixelToHexKey } from '$lib/map/utils/hexlib';

  // Helper function to calculate region center for labels
  function calculateRegionCenter(tiles: Array<[number, number]>): { x: number; y: number } {
    if (tiles.length === 0) {
      return { x: 0, y: 0 };
    }
    
    // Calculate the center based on the average of all tile positions
    const sumQ = tiles.reduce((sum, [q]) => sum + q, 0);
    const sumR = tiles.reduce((sum, [_, r]) => sum + r, 0);
    
    const centerQ = sumQ / tiles.length;
    const centerR = sumR / tiles.length;
    
    // Convert to pixel coordinates (top-down)
    return hexToPixel(centerQ, centerR);
  }
  
  // POI icons dictionary for displaying in the info panel
  const POI_ICONS: Record<string, string> = {
    town: '🏘️',
    city: '🏙️',
    castle: '🏰',
    dungeon: '🏛️',
    cave: '🗻',
    temple: '⛩️',
    camp: '⛺',
    ruins: '🏚️',
    port: '⚓',
    mountain: '⛰️',
    forest: '🌲',
    landmark: '🗿',
    quest: '❗',
    treasure: '💰',
    default: '📍'
  };
  
  // Canvas reference
  let canvasContainer: HTMLDivElement;
  // SVG reference
  let svgElement: SVGSVGElement;
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
    // Don't handle if we're dragging
    if (isDragging) return;
    
    // Check if the click was directly on the canvas (not on a hex)
    // If e.target is the SVG element or the main transform group, proceed
    // Otherwise, the click was handled by a hex tile and shouldn't be processed here
    if (e.target !== svgElement && 
        !(e.target instanceof SVGGElement && e.target.classList.contains('map-transform-group'))) {
      console.log('Click handled by a hex tile, ignoring in canvas handler');
      return;
    }
    
    const rect = canvasContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert to world space
    const worldX = (x - $uiStore.cameraOffset.x) / $uiStore.cameraZoom;
    const worldY = (y - $uiStore.cameraOffset.y) / $uiStore.cameraZoom;
    
    // Find hex at click position (top-down)
    const hexKey = pixelToHexKey(worldX, worldY);
    
    // Debug what hex was clicked
    console.log(`Canvas click at world coords (${worldX.toFixed(2)}, ${worldY.toFixed(2)}) mapped to hex: ${hexKey}`);
    
    // Only process this click if the hex exists in our map
    if (hexKey && $mapData.tiles.has(hexKey)) {
      // Handle click based on current tool
      handleHexClick(hexKey);
    }
  }
  
  // Helper: get all tile keys in brush area for a given center
  function getBrushTileKeys(centerQ: number, centerR: number, radius: number) {
    const brushTiles = getHexesInRange(centerQ, centerR, radius - 1);
    console.log('[BRUSH PAINT] center', { q: centerQ, r: centerR }, 'radius', radius, 'brushTiles', brushTiles);
    return brushTiles.map(([q, r]) => `${q},${r}`);
  }

  // Remove brush logic from handleHexClick, only keep for canvas background actions
  function handleHexClick(hexKey: string) {
    const tile = $mapData.tiles.get(hexKey);
    if (!tile) return;
    const { q, r } = tile;
    // Only handle non-brush tools here (e.g., POI, region, select, route)
    switch ($uiStore.currentTool) {
      case 'poi':
        showModal({
          type: 'poi',
          tileKey: hexKey,
          editingPOI: tile.pois.length > 0 ? tile.pois[0] : undefined
        });
        break;
      case 'select':
      case 'region':
      case 'route':
        // Already handled by HexTile component
        break;
      default:
        break;
    }
  }
  
  // Center the map in the viewport
  function centerMapInViewport() {
    if (!canvasContainer) return;
    
    // Get container dimensions
    const containerRect = canvasContainer.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Update camera offset to center the map
    updateCameraOffset(
      containerWidth / 2,
      containerHeight / 2
    );
  }
  
  // Add a mouseleave handler to clear hoveredTile when the mouse leaves the map area
  function handleCanvasMouseLeave() {
    uiStore.set({
      ...$uiStore,
      hoveredTile: null,
      hoveredRegion: null
    });
  }

  // Setup event listeners
  onMount(() => {
    // Initialize map if needed
    if ($mapData.tiles.size === 0) {
      generateHexGrid();
    }
    
    // Center the map after generation
    centerMapInViewport();
    
    // Add event listeners
    canvasContainer.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvasContainer.addEventListener('wheel', handleWheel);
    canvasContainer.addEventListener('click', handleCanvasClick);
    
    // Also center the map when window resizes
    window.addEventListener('resize', centerMapInViewport);
    
    return () => {
      // Clean up event listeners
      canvasContainer.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvasContainer.removeEventListener('wheel', handleWheel);
      canvasContainer.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('resize', centerMapInViewport);
    };
  });
  
  // Convert map data to array for rendering
  $: tileArray = Array.from($mapData.tiles.entries()).map(([key, tile]) => {
    return { key, ...tile };
  });
  
  // Find current hovered/selected states
  $: getHoveredState = (q: number, r: number): boolean => {
    return Boolean($uiStore.hoveredTile && 
           $uiStore.hoveredTile.q === q && 
           $uiStore.hoveredTile.r === r);
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
  
  // Get information for the currently hovered region
  $: hoveredRegion = $uiStore.hoveredRegion ? 
    Array.from($mapData.regions.values()).find(r => r.id === $uiStore.hoveredRegion) : 
    null;
    
  // Set hover information for the region
  $: if (hoveredRegion) {
    uiStore.set({
      ...$uiStore,
      hoveredRegionInfo: {
        id: hoveredRegion.id,
        name: hoveredRegion.name,
        color: hoveredRegion.color,
        description: hoveredRegion.description || ''
      }
    });
  } else {
    uiStore.set({
      ...$uiStore,
      hoveredRegionInfo: null
    });
  }
  
  // Determine if a region is hovered, ensuring we return a boolean
  function isRegionHovered(regionId: string): boolean {
    return $uiStore.hoveredRegion === regionId ? true : false;
  }

  // Overlay image state
  let overlayImage: string | null = null;
  let overlayX = 0; // px
  let overlayY = 0; // px
  let overlayScale = 1;
  let overlayOpacity = 0.5;
  let overlayDragging = false;
  let overlayDragOffset = { x: 0, y: 0 };
  let overlayLocked = false;

  function handleOverlayUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        overlayImage = ev.target?.result as string;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  function startOverlayDrag(e: MouseEvent) {
    if (!overlayImage) return;
    overlayDragging = true;
    overlayDragOffset = {
      x: e.clientX - overlayX,
      y: e.clientY - overlayY
    };
    window.addEventListener('mousemove', onOverlayDrag);
    window.addEventListener('mouseup', stopOverlayDrag);
  }

  function onOverlayDrag(e: MouseEvent) {
    if (!overlayDragging) return;
    overlayX = e.clientX - overlayDragOffset.x;
    overlayY = e.clientY - overlayDragOffset.y;
  }

  function stopOverlayDrag() {
    overlayDragging = false;
    window.removeEventListener('mousemove', onOverlayDrag);
    window.removeEventListener('mouseup', stopOverlayDrag);
  }

  function resetOverlay() {
    overlayImage = null;
    overlayX = 0;
    overlayY = 0;
    overlayScale = 1;
    overlayOpacity = 0.5;
  }

  function toggleOverlayLock() {
    overlayLocked = !overlayLocked;
  }
</script>

<!-- Main map container -->
<div 
  class="map-canvas-container" 
  bind:this={canvasContainer}
  on:mouseleave={handleCanvasMouseLeave}
>
  <!-- Overlay Image Tool UI and Image -->
  <div class="overlay-controls">
    <label class="overlay-upload-label">
      <input type="file" accept="image/*" on:change={handleOverlayUpload} style="display:none" />
      {overlayImage ? 'Change Overlay Image' : 'Upload Overlay Image'}
    </label>
    {#if overlayImage}
      <div class="overlay-sliders">
        <label>Opacity <input type="range" min="0" max="1" step="0.01" bind:value={overlayOpacity} /></label>
        <label>Scale <input type="range" min="0.1" max="3" step="0.01" bind:value={overlayScale} /></label>
        <button on:click={resetOverlay}>Remove Overlay</button>
        <button on:click={toggleOverlayLock} type="button">{overlayLocked ? 'Unlock Overlay' : 'Lock Overlay'}</button>
      </div>
    {/if}
  </div>
  {#if overlayImage}
    <img
      src={overlayImage}
      alt="Overlay"
      class="map-overlay-image"
      style="left: {overlayX}px; top: {overlayY}px; opacity: {overlayOpacity}; transform: scale({overlayScale}); pointer-events: {overlayLocked ? 'none' : 'auto'};"
      draggable="false"
      on:mousedown={!overlayLocked ? startOverlayDrag : undefined}
    />
  {/if}
  <!-- Info Displays -->
  <!-- POI Info Display -->
  {#if $uiStore.hoveredPOI}
    <div class="info-display">
      <div class="info-content">
        <div class="info-title">
          <span class="info-icon">{$uiStore.hoveredPOI.icon in POI_ICONS ? POI_ICONS[$uiStore.hoveredPOI.icon] : POI_ICONS.default}</span>
          <h3>{$uiStore.hoveredPOI.name}</h3>
        </div>
        {#if $uiStore.hoveredPOI.description}
          <p class="info-description">{$uiStore.hoveredPOI.description}</p>
        {/if}
      </div>
    </div>
  {/if}
  
  <!-- Region Info Display -->
  {#if $uiStore.hoveredRegionInfo}
    <div class="info-display">
      <div class="info-content" style="border-left: 4px solid {$uiStore.hoveredRegionInfo.color}">
        <div class="info-title">
          <span class="info-icon region-icon">🔷</span>
          <h3>{$uiStore.hoveredRegionInfo.name}</h3>
        </div>
        {#if $uiStore.hoveredRegionInfo.description}
          <p class="info-description">{$uiStore.hoveredRegionInfo.description}</p>
        {/if}
      </div>
    </div>
  {/if}
  
  <!-- Route Info Display -->
  {#if $uiStore.hoveredRoute}
    <div class="info-display">
      <div class="info-content route-content" style="border-left: 4px solid {$uiStore.hoveredRoute.color}">
        <div class="info-title">
          <span class="info-icon route-icon">🧭</span>
          <h3>{$uiStore.hoveredRoute.name} {$uiStore.hoveredRoute.lengthInDays > 0 ? `(${$uiStore.hoveredRoute.lengthInDays} days)` : ''}</h3>
        </div>
        
        <!-- Participants Section -->
        {#if $uiStore.hoveredRoute.participants && $uiStore.hoveredRoute.participants.length > 0}
          <div class="route-participants">
            <div class="participants-title">Participants:</div>
            <ul class="participants-list">
              {#each $uiStore.hoveredRoute.participants as participant}
                <li>{participant}</li>
              {/each}
            </ul>
          </div>
        {/if}
        
        <!-- GM Section -->
        {#if $uiStore.hoveredRoute.gm}
          <div class="route-gm">
            <div class="gm-title">Game Master:</div>
            <div class="gm-name">{$uiStore.hoveredRoute.gm}</div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
  
  <!-- Waypoint Info Display -->
  {#if $uiStore.hoveredWaypoint && $uiStore.hoveredWaypoint.routeId}
    {@const route = $routesData.routes.get($uiStore.hoveredWaypoint.routeId)}
    {@const waypointIndex = route && $uiStore.hoveredWaypoint?.waypointId 
      ? route.waypoints.findIndex(w => w.id === $uiStore.hoveredWaypoint?.waypointId)
      : -1}
    <div class="info-display">
      <div class="info-content waypoint-content" style="border-left: 4px solid {
        $uiStore.hoveredWaypoint.routeColor || route?.color || '#888'
      }">
        <div class="info-title">
          <span class="info-icon waypoint-icon">🧭</span>
          <h3>From {$uiStore.hoveredWaypoint.routeName || route?.name || 'Unknown'}</h3>
        </div>
        {#if $uiStore.hoveredWaypoint?.date}
          <div class="waypoint-detail">
            <span class="detail-label">Date:</span>
            <span class="detail-value">{new Date($uiStore.hoveredWaypoint.date).toLocaleDateString()}</span>
          </div>
        {/if}
        {#if $uiStore.hoveredWaypoint?.notes}
          <p class="info-description">{$uiStore.hoveredWaypoint.notes}</p>
        {/if}
        
        {#if waypointIndex > 0 && route}
          <div class="waypoint-days">
            <span class="detail-label">Days traveled:</span>
            <span class="detail-value">
              {waypointIndex} {waypointIndex === 1 ? 'day' : 'days'}
            </span>
          </div>
        {/if}
        
        <!-- Participants Section -->
        {#if $uiStore.hoveredWaypoint.participants && $uiStore.hoveredWaypoint.participants.length > 0}
          <div class="route-participants">
            <div class="participants-title">Participants:</div>
            <ul class="participants-list">
              {#each $uiStore.hoveredWaypoint.participants as participant}
                <li>{participant}</li>
              {/each}
            </ul>
          </div>
        {/if}
        
        <!-- GM Section -->
        {#if $uiStore.hoveredWaypoint.gm}
          <div class="route-gm">
            <div class="gm-title">Game Master:</div>
            <div class="gm-name">{$uiStore.hoveredWaypoint.gm}</div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
  
  <!-- Modals -->
  <RouteModal />
  <WaypointModal />
  <POIModal />
  <RegionModal />
  
  <!-- SVG canvas for hex map -->
  <svg
    bind:this={svgElement} 
    class="hex-map-svg"
    width="100%"
    height="100%"
    overflow="visible"
  >
    <!-- Main transformation group for pan/zoom -->
    <g
      class="map-transform-group"
      transform="translate({$uiStore.cameraOffset.x} {$uiStore.cameraOffset.y}) scale({$uiStore.cameraZoom})"
    >
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
          icon={tile.icon}
        />
      {/each}
      
      <!-- Routes (draw before regions but after tiles) -->
      {#each Array.from($routesData.routes.values()).filter(route => route.visible) as route (route.id)}
        <!-- Route path with unique identifier -->
        <RouteRenderer 
          routeId={route.id}
          routeName={route.name}
          waypoints={route.waypoints}
          color={route.color}
          isEditable={route.editable}
          lengthInDays={getRouteLengthInDays(route.id)}
          participants={route.participants || []}
          gm={route.gm}
        />
        
        <!-- Waypoint markers -->
        {#each route.waypoints as waypoint, i (waypoint.id)}
          <WaypointMarker
            routeId={route.id}
            waypointId={waypoint.id}
            q={waypoint.q}
            r={waypoint.r}
            date={waypoint.date}
            notes={waypoint.notes}
            color={route.color}
            index={i}
            isEditable={route.editable}
          />
        {/each}
      {/each}
      
      <!-- Region outlines, rendered last to appear on top -->
      {#each Array.from($mapData.regions.values()) as region}
        <RegionOutline 
          regionId={region.id} 
          regionName={region.name} 
          regionColor={region.color}
          regionDescription={region.description}
          tiles={region.tiles} 
          isHovered={isRegionHovered(region.id)}
        />
      {/each}
    </g>
  </svg>
</div>

<style>
  .map-canvas-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    background-color: #222;
  }
  
  .hex-map-svg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
  }
  
  /* Info Display Styles */
  .info-display {
    position: absolute;
    top: 10px;
    left: 0;
    right: 0;
    margin: 0 auto;
    width: 90%;
    max-width: 400px;
    z-index: 100;
    pointer-events: none; /* Allow clicks to pass through */
  }
  
  .info-content {
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    border-radius: 8px;
    padding: 12px 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    transition: opacity 0.2s ease-in-out;
    font-family: sans-serif;
  }
  
  .info-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
  }
  
  .info-title h3 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
  }
  
  .info-icon {
    font-size: 1.5rem;
  }
  
  .region-icon {
    color: #4CAF50;
  }
  
  .info-description {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.9);
  }
  
  /* Route and Waypoint info styles */
  .route-icon, .waypoint-icon {
    color: #ff9800;
  }
  
  .route-detail, .waypoint-detail {
    display: flex;
    align-items: center;
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
    background-color: rgba(255, 255, 255, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 3px;
  }
  
  /* Route participants and GM styles */
  .route-participants, .route-gm {
    margin-top: 10px;
    padding: 6px 8px;
    background-color: rgba(255, 255, 255, 0.08);
    border-radius: 4px;
  }
  
  .participants-title, .gm-title {
    font-size: 0.9rem;
    font-weight: 500;
    color: #aaa;
    margin-bottom: 4px;
  }
  
  .participants-list {
    margin: 0;
    padding-left: 18px;
    font-size: 0.85rem;
  }
  
  .participants-list li {
    margin-bottom: 2px;
  }
  
  .gm-name {
    font-size: 0.85rem;
    padding-left: 8px;
  }
  
  .detail-label {
    color: #aaa;
    margin-right: 0.5rem;
  }
  
  .detail-value {
    color: white;
    font-weight: 500;
  }
  
  .waypoint-route {
    font-size: 0.8rem;
    margin-top: 0.5rem;
    color: #aaa;
    display: flex;
    align-items: center;
  }
  
  .route-label {
    margin-right: 0.5rem;
  }
  
  .route-name {
    color: white;
    font-weight: 500;
  }

  .map-overlay-image {
    position: absolute;
    z-index: 10;
    pointer-events: auto;
    cursor: move;
    max-width: none;
    max-height: none;
    user-select: none;
  }
  .overlay-controls {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 20;
    background: rgba(34,34,34,0.95);
    color: #fff;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    font-size: 0.95rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .overlay-upload-label {
    cursor: pointer;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }
  .overlay-sliders label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95em;
  }
  .overlay-sliders input[type="range"] {
    flex: 1;
  }
  .overlay-sliders button {
    margin-top: 0.5rem;
    background: #444;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 0.3rem 0.7rem;
    cursor: pointer;
  }
  .overlay-sliders button:hover {
    background: #666;
  }
</style>
