<script lang="ts">
  import { uiStore, showModal } from '$lib/map/stores/uiStore';
  import { calculateRegionBoundary, generatePathFromPoints } from '$lib/map/utils/hexlib';
  
  // Props
  export let regionId: string;
  export let regionName: string;
  export let regionColor: string;
  export let tiles: Array<[number, number]>;
  export let isHovered: boolean | null = false;
  
  // Calculate the boundary points of the region
  $: boundaryPoints = calculateRegionBoundary(tiles);
  $: outlinePath = generatePathFromPoints(boundaryPoints);
  
  // Calculate center position for the label
  $: center = calculateRegionCenter(boundaryPoints);
  
  // Calculate a central position for the region name
  function calculateRegionCenter(points: Array<{ x: number; y: number }>): { x: number; y: number } {
    if (points.length === 0) {
      return { x: 0, y: 0 };
    }
    
    // Simple average of all points
    const sumX = points.reduce((sum, point) => sum + point.x, 0);
    const sumY = points.reduce((sum, point) => sum + point.y, 0);
    
    return {
      x: sumX / points.length,
      y: sumY / points.length
    };
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
    $uiStore.hoveredRegion = regionId;
  }
  
  function handleMouseLeave() {
    if ($uiStore.hoveredRegion === regionId) {
      $uiStore.hoveredRegion = null;
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

<div 
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
  <!-- SVG for the region outline -->
  <svg class="region-outline" width="100%" height="100%" overflow="visible">
    <path 
      d={outlinePath} 
      fill="none" 
      stroke={regionColor} 
      stroke-width={isHovered ? 3 : 2}
      stroke-opacity={isHovered ? 0.9 : 0.7}
      vector-effect="non-scaling-stroke"
    />
    
    <!-- Background fill with low opacity -->
    <path 
      d={outlinePath} 
      fill={regionColor} 
      fill-opacity={isHovered ? 0.2 : 0.1}
      stroke="none"
    />
    
    <!-- Region label -->
    {#if $uiStore.showLabels && center}
      <g class="region-label" transform={`translate(${center.x}, ${center.y})`}>
        <rect 
          x="-60" 
          y="-15" 
          width="120" 
          height="30" 
          rx="5" 
          fill={regionColor} 
          fill-opacity="0.7" 
        />
        <text 
          x="0" 
          y="5" 
          text-anchor="middle" 
          dominant-baseline="middle"
          fill="white"
          font-weight="bold"
          font-size="14"
          pointer-events="none"
        >
          {regionName}
        </text>
      </g>
    {/if}
  </svg>
</div>

<style>
  .region-outline-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: all;
    cursor: pointer;
    z-index: 5; /* Above tiles but below POIs */
  }
  
  .region-outline {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  
  .region-label {
    cursor: pointer;
    pointer-events: all;
    filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5));
    opacity: 0.9;
    transition: opacity 0.2s, transform 0.2s;
  }
  
  .hovered .region-label {
    opacity: 1;
    transform: scale(1.05);
  }
</style>
