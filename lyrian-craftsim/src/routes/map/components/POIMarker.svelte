<script lang="ts">
  import { uiStore, showModal, setHoveredPOI } from '$lib/map/stores/uiStore';
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
    
    openEditModal();
  }
  
  // Handle keyboard events
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openEditModal();
    }
  }
  
  // Common function to open the edit modal
  function openEditModal() {
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
    // Update the global hovered POI state
    setHoveredPOI({
      id: poiId,
      name: poiName,
      icon: poiIcon,
      description: poiDescription,
      tileKey: tileKey
    });
  }
  
  function handleMouseLeave() {
    // Clear the global hovered POI state
    setHoveredPOI(null);
  }
  
  // Position offsets (may be used to place multiple POIs on one tile)
  const offsetY = -15; // Slightly above center
</script>

<!-- POI marker in SVG - with absolute positioning -->
<g 
  class="poi-marker"
  transform="translate({position.x}, {position.y + offsetY})"
  on:click={handleClick}
  on:keydown={handleKeyDown}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  role="button"
  tabindex="0"
  aria-label="{poiName} - Click to edit"
>
  <!-- Icon text (no background circle) -->
  <text 
    x="0" 
    y="0" 
    text-anchor="middle" 
    dominant-baseline="middle" 
    font-size="16"
    fill="white"
    stroke="rgba(0, 0, 0, 0.5)"
    stroke-width="0.5"
    class="poi-icon-text"
  >
    {displayIcon}
  </text>
  
  <!-- POI name text below the icon (conditionally shown) -->
  {#if $uiStore.showPOILabels}
    <text 
      x="0" 
      y="14" 
      text-anchor="middle" 
      dominant-baseline="middle" 
      font-size="10"
      fill="white"
      stroke="rgba(0, 0, 0, 0.8)"
      stroke-width="1"
      paint-order="stroke"
      class="poi-name-text"
    >
      {poiName}
    </text>
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
