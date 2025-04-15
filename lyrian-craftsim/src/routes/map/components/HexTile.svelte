<script lang="ts">
  import { uiStore, selectTool, selectBiome, toggleTileSelection } from '$lib/map/stores/uiStore';
  import { mapData, updateBiome, updateHeight, addPOI } from '$lib/map/stores/mapStore';
  import type { POI } from '$lib/map/stores/mapStore';
  import { hexToIsometric, getHexVertices } from '$lib/map/utils/hexlib';
  import POIMarker from './POIMarker.svelte';
  
  // Props for the hex tile
  export let q: number;
  export let r: number;
  export let biome: string;
  export let height: number = 0;
  export let pois: POI[] = [];
  export let tileKey: string;
  export let isSelected: boolean = false;
  export let isHovered: boolean = false;
  
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
    
    const currentTool = $uiStore.currentTool;
    
    switch (currentTool) {
      case 'select':
        // Select this tile
        toggleTileSelection(q, r);
        break;
        
      case 'biome':
        // Change the biome
        updateBiome(tileKey, $uiStore.selectedBiome);
        break;
        
      case 'height':
        // Change the height
        updateHeight(tileKey, $uiStore.selectedHeight);
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
        
      default:
        break;
    }
  }
  
  // Handle hover events
  function handleMouseEnter() {
    // Update the hovered tile in the store
    const currentState = $uiStore;
    uiStore.set({
      ...currentState,
      hoveredTile: { q, r }
    });
  }
  
  function handleMouseLeave() {
    // Clear the hover state if it's this tile
    const currentState = $uiStore;
    if (currentState.hoveredTile && currentState.hoveredTile.q === q && currentState.hoveredTile.r === r) {
      uiStore.set({
        ...currentState,
        hoveredTile: null
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
</script>

<g 
  class="hex-tile"
  class:selected={isSelected}
  class:hovered={isHovered}
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
  />
  
  <!-- Height indicator at center of hex -->
  {#if height > 0 && $uiStore.showLabels}
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
  
  <!-- POI markers -->
  {#each pois as poi}
    <POIMarker
      poiId={poi.id}
      poiName={poi.name}
      poiIcon={poi.icon}
      poiDescription={poi.description || ''}
      tileKey={tileKey}
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
</style>
