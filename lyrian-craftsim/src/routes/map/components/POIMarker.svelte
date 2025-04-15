<script lang="ts">
  import { uiStore, showModal } from '$lib/map/stores/uiStore';
  import { mapData } from '$lib/map/stores/mapStore';
  import { hexToIsometric, getHexCoordinatesFromKey } from '$lib/map/utils/hexlib';
  
  // Props
  export let poiId: string;
  export let poiName: string;
  export let poiIcon: string;
  export let poiDescription: string;
  export let tileKey: string;
  
  // Show tooltip state
  let showTooltip = false;
  
  // Get tile coordinates from the key
  $: tileCoords = getHexCoordinatesFromKey(tileKey);
  // Calculate position based on tile coordinates
  $: position = hexToIsometric(tileCoords[0], tileCoords[1]);
  
  // Icon display helpers
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
  
  // Get the icon for this POI
  $: displayIcon = POI_ICONS[poiIcon] || POI_ICONS.default;
  
  // Handle POI click to edit
  function handleClick(event: MouseEvent) {
    // Stop event propagation to prevent triggering the tile click event
    event.stopPropagation();
    
    // Open edit modal for this POI
    showModal({
      type: 'poi',
      tileKey,
      editingPOI: {
        id: poiId,
        name: poiName,
        icon: poiIcon,
        description: poiDescription
      }
    });
  }
  
  // Handle mouse events for tooltip
  function handleMouseEnter() {
    showTooltip = true;
  }
  
  function handleMouseLeave() {
    showTooltip = false;
  }
  
  // Position offsets (may be used to place multiple POIs on one tile)
  const offsetY = -15; // Slightly above center
</script>

<!-- POI marker in SVG - with absolute positioning -->
<g 
  class="poi-marker"
  transform="translate({position.x}, {position.y + offsetY})"
  on:click={handleClick}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
>
  <!-- Icon background circle -->
  <circle 
    cx="0" 
    cy="0" 
    r="12" 
    fill="rgba(0, 0, 0, 0.6)" 
    stroke="white" 
    stroke-width="1"
    class="poi-icon-bg"
  />
  
  <!-- Icon text -->
  <text 
    x="0" 
    y="0" 
    text-anchor="middle" 
    dominant-baseline="middle" 
    font-size="14"
    fill="white"
    class="poi-icon-text"
  >
    {displayIcon}
  </text>
  
  <!-- Tooltip shown on hover -->
  {#if showTooltip}
    <foreignObject x="-100" y="-80" width="200" height="80" class="tooltip-container">
      <div class="poi-tooltip">
        <h3>{poiName}</h3>
        {#if poiDescription}
          <p>{poiDescription}</p>
        {/if}
        <span class="tooltip-hint">Click to edit</span>
      </div>
    </foreignObject>
  {/if}
</g>

<style>
  .poi-marker {
    cursor: pointer;
  }
  
  .poi-icon-bg {
    transition: transform 0.2s, filter 0.2s;
    transform-origin: center;
  }
  
  .poi-marker:hover .poi-icon-bg {
    transform: scale(1.2);
    filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.7));
  }
  
  .poi-tooltip {
    background-color: rgba(0, 0, 0, 0.85);
    color: white;
    border-radius: 4px;
    padding: 8px;
    font-size: 0.85rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    pointer-events: none;
    width: 100%;
    max-height: 100%;
    overflow: hidden;
  }
  
  .poi-tooltip h3 {
    margin: 0 0 4px;
    font-size: 1rem;
    font-weight: 500;
  }
  
  .poi-tooltip p {
    margin: 0 0 6px;
    opacity: 0.9;
  }
  
  .tooltip-hint {
    display: block;
    font-size: 0.75rem;
    opacity: 0.7;
    font-style: italic;
    text-align: right;
  }
  
  .tooltip-container {
    overflow: visible;
  }
</style>
