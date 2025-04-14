// Using Svelte store for state management
import { writable, get } from 'svelte/store';

// Define our custom Tile type
export interface TileHex {
  q: number;
  r: number;
  s: number;
  x: number;
  y: number;
  biome: string;
  height: number;
  pois: POI[];
  regionId: string | null;
}

export interface POI {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Region {
  id: string;
  name: string;
  color: string;
  tiles: string[]; // Coordinate strings
}

export interface MapData {
  tiles: Map<string, TileHex>;
  regions: Region[];
  mapName: string;
}

// Initialize the map data
export const mapData = writable<MapData>({
  tiles: new Map<string, TileHex>(),
  regions: [],
  mapName: 'Untitled Map'
});

// Helper function to get a tile key from coordinates
export function getTileKey(q: number, r: number): string {
  return `${q},${r}`;
}

// Convert hex color string to a number for Three.js
export function colorToNumber(color: string): number {
  if (color.startsWith('#')) {
    return parseInt(color.substring(1), 16);
  }
  return 0xffffff; // Default to white
}

// Function to set a tile's biome
export function setTileBiome(coords: [number, number], biome: string) {
  const [q, r] = coords;
  const key = getTileKey(q, r);
  
  mapData.update(state => {
    const tiles = new Map(state.tiles);
    const tile = tiles.get(key);
    
    if (tile) {
      tiles.set(key, { ...tile, biome });
    }
    
    return { ...state, tiles };
  });
}

// Function to add a POI to a tile
export function addPOI(coords: [number, number], poi: Omit<POI, 'id'>) {
  const [q, r] = coords;
  const key = getTileKey(q, r);
  const id = crypto.randomUUID();
  
  mapData.update(state => {
    const tiles = new Map(state.tiles);
    const tile = tiles.get(key);
    
    if (tile) {
      const newPoi = { id, ...poi };
      tiles.set(key, { 
        ...tile, 
        pois: [...tile.pois, newPoi]
      });
    }
    
    return { ...state, tiles };
  });
  
  return id;
}

// Function to remove a POI from a tile
export function removePOI(coords: [number, number], poiId: string) {
  const [q, r] = coords;
  const key = getTileKey(q, r);
  
  mapData.update(state => {
    const tiles = new Map(state.tiles);
    const tile = tiles.get(key);
    
    if (tile) {
      tiles.set(key, { 
        ...tile, 
        pois: tile.pois.filter(poi => poi.id !== poiId)
      });
    }
    
    return { ...state, tiles };
  });
}

// Function to create a new region
export function createRegion(name: string, color: string, tileCoords: [number, number][]) {
  const id = crypto.randomUUID();
  const tileKeys = tileCoords.map(([q, r]) => getTileKey(q, r));
  const region = { id, name, color, tiles: tileKeys };
  
  mapData.update(state => {
    // Add the new region
    const regions = [...state.regions, region];
    const tiles = new Map(state.tiles);
    
    // Update tiles to reference this region
    tileCoords.forEach(([q, r]) => {
      const key = getTileKey(q, r);
      const tile = tiles.get(key);
      if (tile) {
        tiles.set(key, { ...tile, regionId: id });
      }
    });
    
    return { ...state, regions, tiles };
  });
  
  return id;
}

// Function to remove a region
export function removeRegion(regionId: string) {
  mapData.update(state => {
    // Remove the region
    const regions = state.regions.filter(r => r.id !== regionId);
    const tiles = new Map(state.tiles);
    
    // Update tiles to no longer reference this region
    for (const [key, tile] of tiles.entries()) {
      if (tile.regionId === regionId) {
        tiles.set(key, { ...tile, regionId: null });
      }
    }
    
    return { ...state, regions, tiles };
  });
}

// Export map data to JSON
export function exportMapJSON() {
  const state = get(mapData);
  
  // Convert Map to array for JSON serialization
  const tilesArray = Array.from(state.tiles.entries()).map(([key, tile]) => ({
    key,
    ...tile
  }));
  
  return {
    tiles: tilesArray,
    regions: state.regions,
    mapName: state.mapName
  };
}

// Import map data from JSON
export function importMapJSON(jsonData: any) {
  try {
    // Convert array back to Map
    const tiles = new Map<string, TileHex>();
    
    if (Array.isArray(jsonData.tiles)) {
      jsonData.tiles.forEach((tile: any) => {
        const { key, ...rest } = tile;
        tiles.set(key, rest);
      });
    }
    
    // Handle regions 
    // Convert legacy tileCoords to tiles if needed
    let regions = [];
    if (Array.isArray(jsonData.regions)) {
      regions = jsonData.regions.map((region: any) => {
        // Handle legacy format
        if (region.tileCoords && !region.tiles) {
          const tiles = region.tileCoords.map(([q, r]: [number, number]) => `${q},${r}`);
          return { ...region, tiles };
        }
        return region;
      });
    }
    
    mapData.set({
      tiles,
      regions,
      mapName: jsonData.mapName || 'Imported Map'
    });
    
    return true;
  } catch (error) {
    console.error('Error importing map data:', error);
    return false;
  }
}
