<script lang="ts">
  import { hexToIsometric } from '$lib/map/utils/hexlib';
  
  // Props
  export let waypoints: Array<{q: number, r: number}> = [];
  export let color: string;
  export let strokeWidth: number = 3;
  export let isEditable: boolean = false;
  
  // Calculate the SVG path string for the route
  $: pathString = generateRoutePath(waypoints);
  
  // Generate the SVG path string from waypoints
  function generateRoutePath(waypoints: Array<{q: number, r: number}>): string {
    if (waypoints.length < 2) return '';
    
    let path = '';
    
    // Start at the first point
    const firstPoint = hexToIsometric(waypoints[0].q, waypoints[0].r);
    path += `M ${firstPoint.x} ${firstPoint.y}`;
    
    // Draw lines to each subsequent point
    for (let i = 1; i < waypoints.length; i++) {
      const point = hexToIsometric(waypoints[i].q, waypoints[i].r);
      path += ` L ${point.x} ${point.y}`;
    }
    
    return path;
  }
</script>

<!-- Route path between waypoints -->
<path 
  d={pathString}
  stroke={color}
  stroke-width={strokeWidth}
  fill="none"
  stroke-linecap="round"
  stroke-linejoin="round"
  class:editable={isEditable}
  class="route-line"
/>

<style>
  .route-line {
    opacity: 0.7;
    pointer-events: none;
  }
  
  .route-line.editable {
    stroke-dasharray: 10 5;
    opacity: 0.9;
  }
</style>
