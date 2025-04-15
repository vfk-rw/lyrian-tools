<script lang="ts">
  import { hexToIsometric } from '$lib/map/utils/hexlib';
  
  // Props
  export let iconPath: string;
  export let q: number;
  export let r: number;
  
  // Calculate position based on tile coordinates
  $: position = hexToIsometric(q, r);
  
  // Position offsets
  const offsetY = -5; // Slightly above center
</script>

<g 
  class="tile-icon"
  transform="translate({position.x}, {position.y + offsetY})"
>
  <image 
    href={iconPath} 
    width="24" 
    height="24" 
    x="-12" 
    y="-12" 
    preserveAspectRatio="xMidYMid meet"
  />
</g>

<style>
  .tile-icon {
    pointer-events: none;
  }
</style>
