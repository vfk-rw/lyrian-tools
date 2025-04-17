<script lang="ts">
  import { hexToPixel } from '$lib/map/utils/hexlib';
  
  // Props
  export let iconPath: string;
  export let q: number;
  export let r: number;
  
  // Calculate position based on tile coordinates (top-down)
  $: position = hexToPixel(q, r);
  
  // Position offsets
  const offsetY = -5; // Slightly above center

  // Determine if this is a hex PNG tile (path contains /hex_png_256x256/)
  $: isHexPng = iconPath.includes('/hex_png_256x256/');

  // For hex PNG tiles, position offset so bottom 256x256 aligns with hex center
  // The PNG is 256x384, so offset y by -128 (384-256)
  $: hexPngOffsetY = isHexPng ? -128 : offsetY;
</script>

<g 
  class="tile-icon"
  transform="translate({position.x}, {position.y + hexPngOffsetY})"
>
  {#if isHexPng}
    <image 
      href={iconPath} 
      width="256" 
      height="384" 
      x="0" 
      y="-384" 
      preserveAspectRatio="xMidYMid meet"
      style="pointer-events: none;"
    />
  {:else}
    <image 
      href={iconPath} 
      width="24" 
      height="24" 
      x="-12" 
      y="-12" 
      preserveAspectRatio="xMidYMid meet"
      style="pointer-events: none;"
    />
  {/if}
</g>

<style>
  .tile-icon {
    pointer-events: none;
  }
</style>
