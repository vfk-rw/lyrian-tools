<script lang="ts">
  import { T } from '@threlte/core';
  import type { POI } from '$lib/map/stores/mapStore';
  
  // Props using traditional syntax
  export let poi: POI;
  export let position: { x: number, y: number, z: number } | [number, number, number];
  export let tileKey: string;
  
  // Define icon-specific colors with hex string format for Threlte
  const ICON_COLORS = {
    city: '#e74c3c',      // red
    town: '#e67e22',      // orange
    village: '#f39c12',    // yellow
    castle: '#8e44ad',     // purple
    ruins: '#7f8c8d',      // gray
    cave: '#2c3e50',       // dark blue
    forest: '#27ae60',     // green
    mountain: '#95a5a6',   // light gray
    temple: '#f1c40f',     // gold
    port: '#3498db',       // blue
    default: '#ecf0f1'     // white
  };
  
  // Calculate derived values using reactive declarations
  $: userData = {
    tileKey,
    poiId: poi.id,
    poiName: poi.name
  };
  
  $: iconColor = ICON_COLORS[poi.icon as keyof typeof ICON_COLORS] || ICON_COLORS.default;
  
  $: geometryType = (() => {
    switch (poi.icon) {
      case 'city': return 'pyramid';
      case 'town': return 'small-pyramid';
      case 'village': return 'tiny-pyramid';
      case 'castle': return 'cube';
      case 'ruins': return 'ring';
      case 'temple': return 'sphere';
      case 'port': return 'triangle';
      default: return 'sphere';
    }
  })();
  
  $: markerPosition = (() => {
    if (Array.isArray(position)) {
      // If position is already a tuple, add Y offset
      return [position[0], position[1] + 2, position[2]] as [number, number, number];
    } else if (position) {
      // If position is an object with x,y,z properties
      return [position.x, position.y + 2, position.z] as [number, number, number];
    }
    // Fallback
    return [0, 2, 0] as [number, number, number];
  })();
</script>

<T.Group position={markerPosition}>
  {#if geometryType === 'pyramid'}
    <T.Mesh {userData} castShadow>
      <T.CylinderGeometry args={[0, 1.5, 3, 4]} />
      <T.MeshStandardMaterial color={iconColor} roughness={0.5} metalness={0.3} />
    </T.Mesh>
  {:else if geometryType === 'small-pyramid'}
    <T.Mesh {userData} castShadow>
      <T.CylinderGeometry args={[0, 1.2, 2.5, 4]} />
      <T.MeshStandardMaterial color={iconColor} roughness={0.5} metalness={0.3} />
    </T.Mesh>
  {:else if geometryType === 'tiny-pyramid'}
    <T.Mesh {userData} castShadow>
      <T.CylinderGeometry args={[0, 1, 2, 4]} />
      <T.MeshStandardMaterial color={iconColor} roughness={0.5} metalness={0.3} />
    </T.Mesh>
  {:else if geometryType === 'cube'}
    <T.Mesh {userData} castShadow>
      <T.BoxGeometry args={[2, 2, 2]} />
      <T.MeshStandardMaterial color={iconColor} roughness={0.5} metalness={0.3} />
    </T.Mesh>
  {:else if geometryType === 'ring'}
    <T.Mesh {userData} castShadow>
      <T.TorusGeometry args={[1, 0.3, 8, 8]} />
      <T.MeshStandardMaterial color={iconColor} roughness={0.5} metalness={0.3} />
    </T.Mesh>
  {:else if geometryType === 'triangle'}
    <T.Mesh {userData} castShadow>
      <T.ConeGeometry args={[1, 2, 3]} />
      <T.MeshStandardMaterial color={iconColor} roughness={0.5} metalness={0.3} />
    </T.Mesh>
  {:else} <!-- Default sphere -->
    <T.Mesh {userData} castShadow>
      <T.SphereGeometry args={[0.8, 8, 8]} />
      <T.MeshStandardMaterial color={iconColor} roughness={0.5} metalness={0.3} />
    </T.Mesh>
  {/if}
  
  <!-- Optional label for the POI name, visible when hovered -->
  <T.Sprite scale={[5, 1, 1]} position={[0, 2, 0]}>
    <T.SpriteMaterial opacity={0.8} transparent={true} />
  </T.Sprite>
</T.Group>
