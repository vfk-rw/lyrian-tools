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
  let svgElement: SVGSVGElement | null = null;
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

  // Handle painting hex PNG tiles
  import { updateTileHexPng } from '$lib/map/stores/mapStore';

  function paintHexPngTiles(centerQ: number, centerR: number, radius: number, hexPngPath: string | null) {
    const brushTiles = getHexesInRange(centerQ, centerR, radius - 1);
    brushTiles.forEach(([q, r]) => {
      const key = `${q},${r}`;
      updateTileHexPng(key, hexPngPath);
    });
  }

function handleCanvasClick(e: MouseEvent) {
  if (isDragging) return;
  if (!svgElement) return;
  if (e.target !== svgElement && 
      !(e.target instanceof SVGGElement && e.target.classList.contains('map-transform-group'))) {
    return;
  }
  const rect = canvasContainer.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const worldX = (x - $uiStore.cameraOffset.x) / $uiStore.cameraZoom;
  const worldY = (y - $uiStore.cameraOffset.y) / $uiStore.cameraZoom;
  const hexKey = pixelToHexKey(worldX, worldY);
  if (!hexKey || !$mapData.tiles.has(hexKey)) return;

  switch ($uiStore.currentTool) {
    case 'hexpng': {
      const tile = $mapData.tiles.get(hexKey);
      if (!tile) return;
      paintHexPngTiles(tile.q, tile.r, $uiStore.brushRadius || 1, $uiStore.selectedHexPng);
      break;
    }
    default:
      handleHexClick(hexKey);
      break;
  }
}

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
        id: hoveredRegion?.id ?? '',
        name: hoveredRegion?.name ?? '',
        color: hoveredRegion?.color ?? '',
        description: hoveredRegion?.description ?? ''
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
</script>

<!-- Main map container -->
<div 
  class="map-canvas-container" 
  bind:this={canvasContainer}
  on:mouseleave={handleCanvasMouseLeave}
>
  <svg 
    bind:this={svgElement} 
    class="map-svg" 
    width="100%" 
    height="100%" 
    style="background-color: #222;"
  >
    <g 
      class="map-transform-group" 
      transform={`translate(${$uiStore.cameraOffset.x}, ${$uiStore.cameraOffset.y}) scale(${$uiStore.cameraZoom})`}
    >
      {#each tileArray as tile (tile.key)}
        <HexTile 
          q={tile.q} 
          r={tile.r} 
          biome={tile.biome} 
          height={tile.height ?? 0} 
          pois={tile.pois} 
          icon={tile.icon} 
          tileKey={tile.key}
          isSelected={getSelectedState(tile.q, tile.r)}
          isHovered={getHoveredState(tile.q, tile.r)}
        />
      {/each}
    </g>
  </svg>
</div>
