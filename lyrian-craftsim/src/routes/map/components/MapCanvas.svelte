<script lang="ts">
  import { get } from 'svelte/store';
  import { writable } from 'svelte/store';
  import { T, Canvas } from '@threlte/core';
  import { OrbitControls } from '@threlte/extras';
  import { mapData } from '$lib/map/stores/mapStore';
  import { uiState, clearSelection } from '$lib/map/stores/uiStore';
  import { initializeMap, hexToScreen } from '$lib/map/utils/hexlib';
  import HexTile from './HexTile.svelte';
  import POIMarker from './POIMarker.svelte';
  import RegionOutline from './RegionOutline.svelte';
  import type { TileHex } from '$lib/map/stores/mapStore';
  
  // Container reference for sizing
  let container: HTMLElement;
  
  // Initialize map if empty
  $effect(() => {
    if ($mapData.tiles.size === 0) {
      initializeMap(10, 10); // Create a 10x10 grid to start
    }
  });
  
  // Tile heights store
  const tileHeights = writable(new Map<string, number>());
  
  // Update tile heights whenever mapData changes
  $effect(() => {
    const heights = new Map<string, number>();
    $mapData.tiles.forEach((tile, key) => {
      heights.set(key, tile.height || 0);
    });
    tileHeights.set(heights);
  });

  // Camera position and target stores for threlte compatibility
  const cameraPosition = writable<[number, number, number]>([100, 100, 100]);
  const cameraTarget = writable<[number, number, number]>([0, 0, 0]);
  
  // Update camera whenever map data changes
  $effect(() => {
    if ($mapData.tiles.size === 0) return;
    
    const bounds = getCameraBounds();
    const size = Math.max(bounds.sizeX, bounds.sizeZ, 50);
    
    cameraTarget.set([bounds.centerX, 0, bounds.centerZ]);
    cameraPosition.set([
      bounds.centerX - size * 0.7, 
      size * 0.8, 
      bounds.centerZ + size * 0.7
    ]);
  });
  
  // Helper function to calculate camera bounds
  function getCameraBounds() {
    // Find the bounds of the map
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    
    $mapData.tiles.forEach(tile => {
      minX = Math.min(minX, tile.x);
      maxX = Math.max(maxX, tile.x);
      minZ = Math.min(minZ, tile.y);
      maxZ = Math.max(maxZ, tile.y);
    });
    
    // Add some padding
    minX -= 20;
    maxX += 20;
    minZ -= 20;
    maxZ += 20;
    
    // Calculate center and size
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const sizeX = maxX - minX;
    const sizeZ = maxZ - minZ;
    
    return { minX, maxX, minZ, maxZ, centerX, centerZ, sizeX, sizeZ };
  }
  
  // Update hovered tile
  function setHoveredTile(key: string | null) {
    uiState.update(state => ({
      ...state,
      hoveredTile: key
    }));
  }
  
  // Update selected tile
  function setSelectedTile(key: string | null) {
    uiState.update(state => ({
      ...state,
      selectedTiles: key ? new Set([key]) : new Set()
    }));
  }
  
  // Add selected tile
  function addSelectedTile(key: string) {
    uiState.update(state => {
      const newSet = new Set(state.selectedTiles);
      newSet.add(key);
      return {
        ...state,
        selectedTiles: newSet
      };
    });
  }
  
  // Handle tile hover
  function handleTileHover(event: CustomEvent) {
    const userData = event.detail.object.userData;
    if (userData && userData.key) {
      setHoveredTile(userData.key);
    }
  }
  
  // Handle tile unhover
  function handleTileUnhover() {
    setHoveredTile(null);
  }
  
  // Handle tile click
  function handleTileClick(event: CustomEvent) {
    const userData = event.detail.object.userData;
    if (!userData || !userData.key) return;
    
    const state = get(uiState);
    const currentTool = state.currentTool || 'select';
    
    if (currentTool === 'select') {
      // If in select mode, add to selection
      if (event.detail.originalEvent?.shiftKey) {
        addSelectedTile(userData.key);
      } else {
        clearSelection();
        addSelectedTile(userData.key);
      }
    } else if (currentTool === 'biome') {
      // Handle biome brush
      setSelectedTile(userData.key);
    } else if (currentTool === 'poi') {
      // Handle POI tool
      setSelectedTile(userData.key);
      uiState.update(state => ({
        ...state,
        showPoiModal: true
      }));
    } else if (currentTool === 'region') {
      // Handle region tool - toggle the tile in the selection
      uiState.update(state => {
        const newSet = new Set(state.selectedTiles);
        if (newSet.has(userData.key)) {
          newSet.delete(userData.key);
        } else {
          newSet.add(userData.key);
        }
        return {
          ...state,
          selectedTiles: newSet
        };
      });
    }
  }

  // Get position for a POI marker (return threlte-compatible position)
  function getPoiPosition(q: number, r: number, height: number): { x: number, y: number, z: number } {
    try {
      // Try to use the library function
      const center = hexToScreen(q, r);
      return { x: center.x, y: height + 1, z: center.y };
    } catch (error) {
      // Fallback to manual calculation
      return { x: q * 15, y: height + 1, z: r * 13 };
    }
  }
</script>

<div class="map-canvas" bind:this={container}>
  <Canvas>
    <!-- Camera setup with OrbitControls as child -->
    <T.PerspectiveCamera
      position={$cameraPosition}
      fov={45}
      near={0.1}
      far={1000}
      makeDefault
    >
      <OrbitControls 
        enableDamping
        target={$cameraTarget}
        maxPolarAngle={Math.PI / 2 - 0.1}
        minDistance={10} 
        maxDistance={500}
      />
    </T.PerspectiveCamera>
    
    <!-- Lighting -->
    <T.AmbientLight intensity={0.7} />
    <T.DirectionalLight 
      position={[100, 100, 100]} 
      intensity={0.8}
      castShadow
    />
    
    <!-- Hex tiles -->
    <T.Group>
      {#each [...$mapData.tiles.entries()] as [key, tile]}
        <T.Group userData={{ key }}
          on:click={handleTileClick}
          on:pointerenter={handleTileHover}
          on:pointerleave={handleTileUnhover}
        >
          <HexTile 
            {tile} 
            {key}
            isSelected={$uiState.selectedTiles.has(key)}
            isHovered={$uiState.hoveredTile === key}
          />
        </T.Group>
      {/each}
    </T.Group>
    
    <!-- POI markers -->
    <T.Group>
      {#each [...$mapData.tiles.entries()] as [key, tile]}
        {#if tile.pois && tile.pois.length > 0}
          {#each tile.pois as poi}
            <POIMarker
              {poi}
              position={getPoiPosition(tile.q, tile.r, tile.height || 0)}
              tileKey={key}
            />
          {/each}
        {/if}
      {/each}
    </T.Group>
    
    <!-- Region outlines -->
    <T.Group>
      {#each $mapData.regions as region}
        <RegionOutline {region} tileHeights={$tileHeights} />
      {/each}
    </T.Group>
  </Canvas>
</div>

<style>
  .map-canvas {
    width: 100%;
    height: 100%;
    background-color: #1a1a1a;
  }
</style>
