<script lang="ts">
  import { uiStore, showModal } from '$lib/map/stores/uiStore';
  
  // Props
  export let poiId: string;
  export let poiName: string;
  export let poiIcon: string;
  export let poiDescription: string;
  export let tileKey: string;
  
  // Show tooltip state
  let showTooltip = false;
  
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
</script>

<div 
  class="poi-marker"
  on:click={handleClick}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
>
  <div class="poi-icon">
    {displayIcon}
  </div>
  
  {#if showTooltip}
    <div class="poi-tooltip">
      <h3>{poiName}</h3>
      {#if poiDescription}
        <p>{poiDescription}</p>
      {/if}
      <span class="tooltip-hint">Click to edit</span>
    </div>
  {/if}
</div>

<style>
  .poi-marker {
    position: absolute;
    transform: translate(-50%, -50%);
    z-index: 10;
    cursor: pointer;
  }
  
  .poi-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 20px;
    background-color: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    transition: transform 0.2s, box-shadow 0.2s;
    text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
  }
  
  .poi-icon:hover {
    transform: scale(1.2);
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
  }
  
  .poi-tooltip {
    position: absolute;
    bottom: calc(100% + 5px);
    left: 50%;
    transform: translateX(-50%);
    width: max-content;
    max-width: 200px;
    background-color: rgba(0, 0, 0, 0.85);
    color: white;
    border-radius: 4px;
    padding: 0.5rem;
    font-size: 0.85rem;
    z-index: 20;
    pointer-events: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  .poi-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: rgba(0, 0, 0, 0.85) transparent transparent transparent;
  }
  
  .poi-tooltip h3 {
    margin: 0 0 0.25rem;
    font-size: 1rem;
    font-weight: 500;
  }
  
  .poi-tooltip p {
    margin: 0 0 0.5rem;
    opacity: 0.9;
  }
  
  .tooltip-hint {
    display: block;
    font-size: 0.75rem;
    opacity: 0.7;
    font-style: italic;
    text-align: right;
    margin-top: 0.25rem;
  }
</style>
