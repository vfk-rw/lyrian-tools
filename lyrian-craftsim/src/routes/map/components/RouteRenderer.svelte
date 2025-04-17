<script lang="ts">
  import { hexToPixel } from '$lib/map/utils/hexlib';
  import { uiStore, setHoveredRoute } from '$lib/map/stores/uiStore';
  
  // Props
  export let routeId: string;
  export let routeName: string;
  export let waypoints: Array<{q: number, r: number}> = [];
  export let color: string;
  export let strokeWidth: number = 3;
  export let isEditable: boolean = false;
  export let lengthInDays: number = 0;
  export let participants: string[] = [];
  export let gm: string | undefined = undefined;
  
  // Calculate the SVG path string for the route
  $: pathString = generateRoutePath(waypoints);
  
  // Generate the SVG path string from waypoints
  function generateRoutePath(waypoints: Array<{q: number, r: number}>): string {
    if (waypoints.length < 2) return '';
    let path = '';
    // Start at the first point (top-down)
    const first = hexToPixel(waypoints[0].q, waypoints[0].r);
    path = `M ${first.x} ${first.y}`;
    
    // Draw lines to each subsequent point (top-down)
    for (let i = 1; i < waypoints.length; i++) {
      const pt = waypoints[i];
      const point = hexToPixel(pt.q, pt.r);
      path += ` L ${point.x} ${point.y}`;
    }
    return path;
  }
  
  // Handle hover events to show route name
  function handleMouseEnter() {
    setHoveredRoute({
      id: routeId,
      name: routeName,
      color: color,
      lengthInDays: lengthInDays,
      participants: participants,
      gm: gm
    });
  }
  
  function handleMouseLeave() {
    setHoveredRoute(null);
  }
</script>

<!-- Each route gets its own group to ensure separation -->
<g 
  class="route-container"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
>
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
</g>

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
