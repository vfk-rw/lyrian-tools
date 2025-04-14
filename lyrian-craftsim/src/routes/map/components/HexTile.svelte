<script lang="ts">
  import { T } from '@threlte/core';
  import { getHexCorners as getLibHexCorners } from '$lib/map/utils/hexlib';
  import type { TileHex } from '$lib/map/stores/mapStore';
  
  // Props
  export let tile: TileHex;
  export let isSelected = false;
  export let isHovered = false;
  export let key: string;
  
  // Create userData for interaction
  const userData = {
    key,
    q: tile.q,
    r: tile.r,
    biome: tile.biome
  };
  
  // Define base colors using hex strings for Threlte
  const COLORS = {
    water: '#3498db',
    forest: '#2ecc71',
    mountain: '#95a5a6',
    desert: '#f1c40f',
    plains: '#8bc34a',
    swamp: '#8e44ad',
    tundra: '#ecf0f1'
  };
  
  // Height for the hex cylinder (with fallback)
  $: height = tile.height || 1;
  
  // Get base color for the biome with hover/selection modifications
  $: displayColor = (() => {
    // Select the base color
    const baseColor = tile.biome in COLORS 
      ? COLORS[tile.biome as keyof typeof COLORS] 
      : COLORS.plains;
    
    // For hover/selection, we'll use a different approach
    // Since we can't use THREE.Color.lerp directly,
    // we'll just return different colors based on state
    if (isSelected) {
      return '#ff9800'; // Selected color - orange
    } else if (isHovered) {
      return '#b8d8b8'; // Hover color - light green
    }
    
    return baseColor;
  })();
  
  // Position at hex coordinates
  $: position = [tile.x, tile.height / 2, tile.y] as [number, number, number];
</script>

<T.Mesh castShadow receiveShadow {userData} {position}>
  <T.CylinderGeometry args={[10, 10, height, 6]} rotation={[Math.PI / 2, 0, 0]} />
  <T.MeshStandardMaterial 
    color={displayColor}
    roughness={0.8}
    metalness={0.2}
  />
</T.Mesh>
