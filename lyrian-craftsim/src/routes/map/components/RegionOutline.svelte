<script lang="ts">
  import { uiStore, showModal } from '$lib/map/stores/uiStore';
  import { hexToIsometric } from '$lib/map/utils/hexlib';
  
  // Props with correct typing
  export let regionId: string;
  export let regionName: string;
  export let regionColor: string;
  export let regionDescription: string | undefined = undefined;
  export let tiles: Array<[number, number]>;
  export let isHovered = false; // Default to false, allow any truthy/falsy value 
  export let showLabel = true; // Whether to show the region label
  
  // Calculate center position for the label
  $: center = calculateRegionCenter(tiles);
  
  // Calculate a better central position for the region name
  function calculateRegionCenter(tiles: Array<[number, number]>): { x: number; y: number } {
    if (tiles.length === 0) {
      return { x: 0, y: 0 };
    }
    
    // Calculate the center based on the average of all tile positions
    const sumQ = tiles.reduce((sum, [q]) => sum + q, 0);
    const sumR = tiles.reduce((sum, [_, r]) => sum + r, 0);
    
    const centerQ = sumQ / tiles.length;
    const centerR = sumR / tiles.length;
    
    // Convert to pixel coordinates
    return hexToIsometric(centerQ, centerR);
  }
  
  // Handle click on the region
  function handleRegionClick(event: MouseEvent | KeyboardEvent) {
    // Stop propagation to prevent tile clicks (only for MouseEvent)
    if (event instanceof MouseEvent) {
      event.stopPropagation();
    }
    
    // Open edit modal for this region
    showModal({
      type: 'region',
      regionId
    });
  }
  
  // Handle mouse enter/leave for hover effects
  function handleMouseEnter() {
    // Update the store properly using set method
    const currentState = $uiStore;
    uiStore.set({
      ...currentState,
      hoveredRegion: regionId
    });
  }
  
  function handleMouseLeave() {
    if ($uiStore.hoveredRegion === regionId) {
      // Update the store properly using set method
      const currentState = $uiStore;
      uiStore.set({
        ...currentState,
        hoveredRegion: null
      });
    }
  }
  
  // Handle keyboard events for accessibility
  function handleKeyDown(event: KeyboardEvent) {
    // Activate on Enter or Space key
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRegionClick(event);
    }
  }
</script>

<g 
  class="region-outline-container"
  class:hovered={isHovered}
  role="button"
  tabindex="0"
  aria-label={`Region: ${regionName}`}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  on:click={handleRegionClick}
  on:keydown={handleKeyDown}
>
  <!-- No region borders shown anymore -->
  
  <!-- Region label (visible if showLabel is true) -->
  {#if $uiStore.showRegionLabels && center && showLabel}
    <g class="region-label" transform={`translate(${center.x}, ${center.y})`}>
      <text 
        x="0" 
        y="5" 
        text-anchor="middle" 
        dominant-baseline="middle"
        fill={regionColor}
        stroke="white"
        stroke-width="2"
        paint-order="stroke fill"
        font-weight="bold"
        font-size="18"
        pointer-events="none"
      >
        {regionName}
      </text>
    </g>
  {/if}
</g>

<style>
  .region-outline-container {
    cursor: pointer;
  }
  
  .region-label {
    cursor: pointer;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7));
    pointer-events: none;
    z-index: 20; /* Ensure it's above hex tiles */
  }
  
  .hovered .region-label text {
    font-weight: 800;
  }
</style>
