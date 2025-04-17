<script lang="ts">
  import { uiStore, selectTool, selectBiome, toggleTileSelection, showModal } from '$lib/map/stores/uiStore';
  import { mapData, updateBiome, updateHeight, addPOI, updateTileIcon } from '$lib/map/stores/mapStore';
  import { activeEditRoute, addWaypoint } from '$lib/map/stores/routeStore';
  import type { POI } from '$lib/map/stores/mapStore';
  import { hexToIsometric, getHexVertices, getHexesInRange, getHexKey } from '$lib/map/utils/hexlib';
  import POIMarker from './POIMarker.svelte';
  import TileIcon from './TileIcon.svelte';
  
  // Props for the hex tile
  export let q: number;
  export let r: number;
  export let biome: string;
  export let height: number = 0;
  export let pois: POI[] = [];
  export let tileKey: string;
  export let isSelected: boolean = false;
  export let isHovered: boolean = false;
  export let icon: string | null = null;
  
  // Calculate SVG points for the hex
  $: vertices = getHexVertices(q, r);
  $: hexPoints = vertices.map(point => `${point.x},${point.y}`).join(' ');
  
  // Get position for the tile
  $: position = hexToIsometric(q, r);
  
  // Calculate vertices once for the polygon
  $: polygonPoints = getHexVertices(q, r)
    .map(v => `${v.x},${v.y}`)
    .join(' ');
  
  // Biome colors - matching the Toolbar colors
  const biomeColors = {
    plains: '#91C13D',    // light green
    forest: '#2C7C30',    // dark green
    mountain: '#8B4513',  // brown
    water: '#1E90FF',     // blue
    desert: '#F4D03F',    // yellow
    swamp: '#556B2F',     // olive
    tundra: '#F0F0F0',    // white
    unexplored: '#cccccc', // gray/unexplored
    default: '#cccccc'
  };
  
  // Handle click based on selected tool
  function handleClick(event: MouseEvent) {
    // Stop event propagation to prevent the canvas click handler from also triggering
    event.stopPropagation();
    
    // Log the tile being clicked
    console.log(`Hex tile clicked: (${q},${r})`);
    
    const radius = $uiStore.brushRadius || 1;
    const brushTiles = getHexesInRange(q, r, radius - 1);
    const tool = $uiStore.currentTool;
    
    switch (tool) {
      case 'select':
        // Select this tile
        toggleTileSelection(q, r);
        break;
        
      case 'biome':
        // Change the biome
        brushTiles.forEach(([bq, br]) => {
          const key = getHexKey(bq, br);
          updateBiome(key, $uiStore.selectedBiome);
        });
        break;
        
      case 'height':
        // Change the height
        brushTiles.forEach(([bq, br]) => {
          const key = getHexKey(bq, br);
          updateHeight(key, $uiStore.selectedHeight);
        });
        break;
        
      case 'poi':
        // Open POI modal for this tile
        uiStore.showModal({
          type: 'poi',
          tileKey
        });
        break;
        
      case 'region':
        // Toggle tile selection for region creation
        toggleTileSelection(q, r);
        break;
        
      case 'icon':
        // Apply the selected icon to this tile
        brushTiles.forEach(([bq, br]) => {
          const key = getHexKey(bq, br);
          updateTileIcon(key, $uiStore.selectedIcon);
        });
        break;
        
      case 'route':
        // Only add waypoint if a route is in edit mode
        if ($activeEditRoute) {
          console.group('[DEBUG] HexTile - Adding waypoint to active route');
          console.log(`Tile coordinates: q=${q}, r=${r}`);
          console.log(`Active route: ${$activeEditRoute.id} (${$activeEditRoute.name})`);
          
          // Add waypoint to the active route
          const waypointId = addWaypoint($activeEditRoute.id, {
            q, r
          });
          
          console.log(`Added waypoint with ID: ${waypointId}`);
          
          // Open waypoint modal for this new waypoint
          showModal({
            type: 'waypoint',
            routeId: $activeEditRoute.id,
            q, r
          });
          
          console.groupEnd();
        } else {
          console.group('[DEBUG] HexTile - No active route, opening route modal');
          console.log(`Tile coordinates: q=${q}, r=${r}`);
          console.log('Will store coordinates for after route creation');
          
          // Store coordinates in uiStore temporarily for after route creation
          uiStore.set({
            ...$uiStore,
            pendingWaypointQ: q,
            pendingWaypointR: r
          });
          
          // If no route is in edit mode, show route creation modal
          showModal({
            type: 'route',
            pendingWaypoint: true // Indicate this is for a pending waypoint
          });
          
          console.groupEnd();
        }
        break;
        
      default:
        break;
    }
    
    console.log(`Hex tile clicked: (${q},${r}) [BRUSH]`, { tool, radius, brushTiles });
  }
  
  // Handle hover events
  function handleMouseEnter() {
    // Check if this tile belongs to a region
    const region = Array.from($mapData.regions.values()).find(region => 
      region.tiles.some(([rq, rr]) => rq === q && rr === r)
    );
    
    // Update the hovered tile in the store and set hoveredRegion if this tile belongs to a region
    const currentState = $uiStore;
    uiStore.set({
      ...currentState,
      hoveredTile: { q, r },
      hoveredRegion: region ? region.id : null
    });
  }
  
  function handleMouseLeave() {
    // Clear the hover state if it's this tile
    const currentState = $uiStore;
    if (currentState.hoveredTile && currentState.hoveredTile.q === q && currentState.hoveredTile.r === r) {
      uiStore.set({
        ...currentState,
        hoveredTile: null,
        hoveredRegion: null
      });
    }
  }
  
  // Get the appropriate fill color
  $: fillColor = biome in biomeColors 
    ? biomeColors[biome as keyof typeof biomeColors] 
    : biomeColors.default;
  
  // Determine stroke appearance based on state
  let strokeWidth: number;
  let strokeColor: string;
  let strokeOpacity: number;
  
  $: {
    strokeWidth = isSelected ? 3 : (isHovered ? 2 : 1);
    strokeColor = isSelected ? '#ffcc00' : (isHovered ? '#ffffff' : '#666666');
    strokeOpacity = isSelected ? 0.9 : (isHovered ? 0.8 : 0.6);
  }
  
  // Calculate elevation visual effect
  $: elevationOffset = height * 2; // 2px per elevation level

  // Helper: is this tile in the brush preview area?
  $: isBrushPreview = false;
  if ($uiStore.hoveredTile && ['biome','height','icon'].includes($uiStore.currentTool)) {
    const { q: hq, r: hr } = $uiStore.hoveredTile;
    const radius = $uiStore.brushRadius || 1;
    const brushTiles = getHexesInRange(hq, hr, radius - 1);
    isBrushPreview = brushTiles.some(([bq, br]) => bq === q && br === r);
    if (isHovered) {
      // Debug: log brush preview info
      console.log('[BRUSH PREVIEW]', { center: { q: hq, r: hr }, radius, brushTiles });
    }
  }
</script>

<g 
  class="hex-tile"
  class:selected={isSelected}
  class:hovered={isHovered}
  class:brush-preview={isBrushPreview}
  on:click={handleClick}
  on:keydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      // Create a synthetic click event
      const syntheticEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      handleClick(syntheticEvent);
      e.preventDefault();
    }
  }}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  role="button"
  tabindex="0"
>
  <!-- Hex background as exact coordinates (no translation) -->
  <polygon 
    points={polygonPoints}
    fill={fillColor}
    stroke={strokeColor}
    stroke-width={strokeWidth}
    stroke-opacity={strokeOpacity}
    vector-effect="non-scaling-stroke"
    transform="translate(0,{-elevationOffset})"
    class:brush-preview={isBrushPreview}
  />
  
  <!-- Height indicator at center of hex -->
  {#if height > 0 && $uiStore.showHeightLabels}
    <text
      x={position.x}
      y={position.y}
      text-anchor="middle"
      dominant-baseline="middle"
      fill="rgba(0,0,0,0.7)"
      font-size="10"
      pointer-events="none"
      transform="translate(0,{-elevationOffset})"
    >
      {height}
    </text>
  {/if}
  
  <!-- Tile Icon (if present) -->
  {#if icon}
    <TileIcon iconPath={icon} {q} {r} />
  {/if}
  
  <!-- POI markers with grouping information -->
  {#each pois as poi, index}
    <POIMarker
      poiId={poi.id}
      poiName={poi.name}
      poiIcon={poi.icon}
      poiDescription={poi.description || ''}
      tileKey={tileKey}
      groupIndex={index}
      groupSize={pois.length}
    />
  {/each}
</g>

<style>
  .hex-tile {
    cursor: pointer;
    transition: transform 0.1s;
  }
  
  .hex-tile:hover {
    z-index: 10;
  }
  
  .hex-tile.selected {
    z-index: 15;
  }

  .hex-tile.brush-preview polygon,
  .hex-tile .brush-preview {
    filter: brightness(1.3) drop-shadow(0 0 6px #00e0ffcc);
    opacity: 0.7;
    pointer-events: none;
  }
</style>
