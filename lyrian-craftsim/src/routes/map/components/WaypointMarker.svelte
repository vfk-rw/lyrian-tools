<script lang="ts">
  import { hexToIsometric } from '$lib/map/utils/hexlib';
  import { uiStore, setHoveredWaypoint, showModal } from '$lib/map/stores/uiStore';
  
  // Props
  export let routeId: string;
  export let waypointId: string;
  export let q: number;
  export let r: number;
  export let color: string;
  export let index: number;
  export let date: string | undefined = undefined;
  export let notes: string | undefined = undefined;
  export let isEditable: boolean = false;
  
  // Calculate position
  $: position = hexToIsometric(q, r);
  
  // Handle hover
  function handleMouseEnter() {
    setHoveredWaypoint({
      routeId,
      waypointId,
      q,
      r,
      date,
      notes
    });
  }
  
  function handleMouseLeave() {
    setHoveredWaypoint(null);
  }
  
  // Handle click
  function handleClick(event: MouseEvent) {
    if (isEditable) {
      // Prevent event from bubbling to the tile
      event.stopPropagation();
      
      // Show the waypoint edit modal
      showModal({
        type: 'waypoint',
        routeId,
        waypointId,
        q,
        r
      });
    }
  }
</script>

<g 
  class="waypoint-marker"
  class:editable={isEditable}
  transform="translate({position.x} {position.y - 3})"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  on:click={handleClick}
>
  <!-- Waypoint marker -->
  <circle 
    cx="0"
    cy="0"
    r="6"
    fill={color}
    stroke="white"
    stroke-width="2"
    class="waypoint-circle"
  />
  
  <!-- Waypoint index (if labels are enabled) -->
  {#if $uiStore.showRouteLabels}
    <text 
      x="0" 
      y="0" 
      text-anchor="middle" 
      dominant-baseline="central"
      fill="white"
      font-size="10"
      font-weight="bold"
      class="waypoint-index"
    >
      {index + 1}
    </text>
  {/if}
  
  <!-- Date badge (if date is set and labels are enabled) -->
  {#if date && $uiStore.showRouteLabels}
    <g class="date-badge" transform="translate(0, -15)">
      <rect
        x="-20"
        y="-10"
        width="40"
        height="15"
        rx="3"
        ry="3"
        fill="rgba(0,0,0,0.7)"
        stroke={color}
      />
      <text
        x="0"
        y="-2"
        text-anchor="middle"
        dominant-baseline="central"
        fill="white"
        font-size="7"
      >
        {new Date(date).toLocaleDateString()}
      </text>
    </g>
  {/if}
</g>

<style>
  .waypoint-marker {
    cursor: pointer;
    pointer-events: all;
  }
  
  .waypoint-marker.editable .waypoint-circle {
    stroke-dasharray: 2;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% { stroke-opacity: 0.5; }
    50% { stroke-opacity: 1; }
    100% { stroke-opacity: 0.5; }
  }
  
  .date-badge {
    opacity: 0.8;
    pointer-events: none;
  }
  
  .waypoint-index {
    pointer-events: none;
    user-select: none;
  }
</style>
