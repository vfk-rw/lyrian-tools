<script lang="ts">
  import { T } from '@threlte/core';
  // We still need some THREE.js classes for vector calculations
  import { Vector3, DoubleSide } from 'three';
  import type { Region } from '$lib/map/stores/mapStore';
  import { mapData } from '$lib/map/stores/mapStore';
  import { writable } from 'svelte/store';
  
  // Props - use traditional export syntax
  export let region: Region;
  export let tileHeights: Map<string, number> | any; // Accept either Map or writable store
  
  // Create userData for interaction
  const userData = {
    id: region.id,
    name: region.name
  };
  
  // Store to hold the calculated outline points
  const outlinePoints = writable<[number, number, number][]>([]);
  
  // Calculate outline points whenever data changes
  function calculateOutlinePoints() {
    if (!region.tiles || region.tiles.length === 0) {
      outlinePoints.set([]);
      return;
    }
    
    try {
      // Handle the case where tileHeights might be a store or a Map
      const heights = tileHeights instanceof Map ? tileHeights : 
                     tileHeights?.subscribe ? get(tileHeights) : new Map<string, number>();
                     
      if (!heights) {
        outlinePoints.set([]);
        return;
      }
      
      // Create vectors for perimeter calculation
      const points: Vector3[] = [];
      const perimeter: Vector3[] = [];
      const tiles = new Map<string, [number, number]>();
      
      // Collect all tiles in the region
      region.tiles.forEach((tileKey: string) => {
        // Parse coordinates from the key string (format: "q,r")
        const [q, r] = tileKey.split(',').map(Number);
        tiles.set(tileKey, [q, r]);
        
        // Get tile from mapData
        const tileData = $mapData.tiles.get(tileKey);
        if (tileData) {
          const height = heights.get(tileKey) || 0;
          // Add center point for convex hull calculation
          points.push(new Vector3(tileData.x, height + 0.1, tileData.y));
        }
      });
      
      // Basic perimeter detection - find edge tiles
      for (const [tileKey, [q, r]] of tiles.entries()) {
        const tileData = $mapData.tiles.get(tileKey);
        if (!tileData) continue;
        
        // Check all 6 neighbor directions
        const directions = [
          [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]
        ];
        
        for (const [dq, dr] of directions) {
          const neighborKey = `${q + dq},${r + dr}`;
          // If neighbor is not in the region, this is an edge
          if (!tiles.has(neighborKey)) {
            const height = heights.get(tileKey) || 0;
            perimeter.push(new Vector3(tileData.x, height + 0.1, tileData.y));
            break;
          }
        }
      }
      
      // If we have perimeter points, use those for the outline
      const usePoints = perimeter.length > 0 ? perimeter : points;
      
      // Convert the Vector3 points to simple tuples for Threlte
      const outlinePositions = usePoints.map(p => [p.x, p.y, p.z] as [number, number, number]);
      
      if (outlinePositions.length >= 3) {
        outlinePoints.set(outlinePositions);
      } else {
        outlinePoints.set([]);
      }
    } catch (error) {
      console.error("Error creating region outline:", error);
      outlinePoints.set([]);
    }
  }
  
  // Extract color from region
  $: regionColor = region.color || '#ffffff';
  
  // Trigger calculation when mapData or region changes
  $: if ($mapData && region) {
    calculateOutlinePoints();
  }
  
  // Need to get a reference to the store value
  function get(store: any) {
    let value;
    store.subscribe((v: any) => {
      value = v;
    })();
    return value;
  }
</script>

{#if $outlinePoints.length >= 3}
  <!-- Line for the region outline - one per point -->
  {#each $outlinePoints as point, i}
    {#if i < $outlinePoints.length - 1}
      <T.Line {userData}>
        <T.BufferGeometry>
          <T.LineCurve3 
            start={$outlinePoints[i]} 
            end={$outlinePoints[i+1]} 
          />
        </T.BufferGeometry>
        <T.LineBasicMaterial
          color={regionColor}
          linewidth={2}
          transparent={true}
          opacity={0.8}
        />
      </T.Line>
    {/if}
  {/each}
  
  <!-- Connect the last point to the first to close the loop -->
  <T.Line {userData}>
    <T.BufferGeometry>
      <T.LineCurve3 
        start={$outlinePoints[$outlinePoints.length-1]} 
        end={$outlinePoints[0]} 
      />
    </T.BufferGeometry>
    <T.LineBasicMaterial
      color={regionColor}
      linewidth={2}
      transparent={true}
      opacity={0.8}
    />
  </T.Line>

  <!-- Plane for region highlighting -->
  <T.Mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
    <T.PlaneGeometry args={[500, 500]} />
    <T.MeshBasicMaterial
      color={regionColor}
      transparent={true}
      opacity={0.15}
      side={DoubleSide}
      polygonOffset={true}
      polygonOffsetFactor={1}
      polygonOffsetUnits={1}
    />
  </T.Mesh>
{/if}
