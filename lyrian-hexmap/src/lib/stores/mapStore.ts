import { writable, derived } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';
import type { MapData, TileData, RegionData, POIData } from '$lib/hexUtils/yamlIO';

// Interface for a map tile
export interface Tile {
  q: number;
  r: number;
  assetId: string;
}

// Interface for a region
export interface Region {
  id: string;
  name: string;
  description: string;
  hexes: { q: number; r: number }[];
}

// Interface for a point of interest
export interface POI {
  id: string;
  name: string;
  description: string;
  q: number;
  r: number;
  icon?: string;
}

// Interface for the map state
interface MapState {
  name: string;
  width: number;
  height: number;
  tiles: Map<string, Tile>;
  regions: Map<string, Region>;
  pois: Map<string, POI>;
  selectedTiles: Set<string>;
  selectedRegion: string | null;
  selectedPOI: string | null;
}

// Generate a key for a tile based on its coordinates
export function getTileKey(q: number, r: number): string {
  return `${q},${r}`;
}

// Parse a tile key into coordinates
export function parseTileKey(key: string): { q: number; r: number } {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

// Create the initial map state
const initialState: MapState = {
  name: 'Untitled Map',
  width: 20,
  height: 15,
  tiles: new Map<string, Tile>(),
  regions: new Map<string, Region>(),
  pois: new Map<string, POI>(),
  selectedTiles: new Set<string>(),
  selectedRegion: null,
  selectedPOI: null
};

// Create the map store
function createMapStore() {
  const { subscribe, set, update } = writable<MapState>(initialState);
  
  return {
    subscribe,
    
    // Initialize a new map with specific dimensions
    initMap: (width: number, height: number, name: string) => {
      set({
        ...initialState,
        width,
        height,
        name,
        tiles: new Map<string, Tile>(),
        regions: new Map<string, Region>(),
        pois: new Map<string, POI>()
      });
    },
    
    // Set a tile at specific coordinates
    setTile: (q: number, r: number, assetId: string) => update(state => {
      const key = getTileKey(q, r);
      const tiles = new Map(state.tiles);
      tiles.set(key, { q, r, assetId });
      return { ...state, tiles };
    }),
    
    // Remove a tile at specific coordinates
    removeTile: (q: number, r: number) => update(state => {
      const key = getTileKey(q, r);
      const tiles = new Map(state.tiles);
      tiles.delete(key);
      return { ...state, tiles };
    }),
    
    // Select tiles by their keys
    selectTiles: (keys: string[]) => update(state => ({
      ...state,
      selectedTiles: new Set(keys),
      selectedRegion: null,
      selectedPOI: null
    })),
    
    // Clear all tile selections
    clearSelection: () => update(state => ({
      ...state,
      selectedTiles: new Set(),
      selectedRegion: null,
      selectedPOI: null
    })),
    
    // Add a new region
    addRegion: (name: string, description: string, hexes: { q: number; r: number }[]) => update(state => {
      const id = uuidv4();
      const regions = new Map(state.regions);
      regions.set(id, { id, name, description, hexes });
      return {
        ...state,
        regions,
        selectedRegion: id,
        selectedTiles: new Set()
      };
    }),
    
    // Update an existing region
    updateRegion: (id: string, data: { name?: string; description?: string }) => update(state => {
      const regions = new Map(state.regions);
      const region = regions.get(id);
      if (region) {
        regions.set(id, {
          ...region,
          name: data.name !== undefined ? data.name : region.name,
          description: data.description !== undefined ? data.description : region.description
        });
      }
      return { ...state, regions };
    }),
    
    // Delete a region
    deleteRegion: (id: string) => update(state => {
      const regions = new Map(state.regions);
      regions.delete(id);
      return {
        ...state,
        regions,
        selectedRegion: null
      };
    }),
    
    // Select a region by ID
    selectRegion: (id: string) => update(state => ({
      ...state,
      selectedRegion: id,
      selectedTiles: new Set(),
      selectedPOI: null
    })),
    
    // Add a new POI
    addPOI: (name: string, description: string, q: number, r: number) => update(state => {
      const id = uuidv4();
      const pois = new Map(state.pois);
      pois.set(id, { id, name, description, q, r });
      return {
        ...state,
        pois,
        selectedPOI: id,
        selectedTiles: new Set(),
        selectedRegion: null
      };
    }),
    
    // Update an existing POI
    updatePOI: (id: string, data: { name?: string; description?: string; q?: number; r?: number }) => update(state => {
      const pois = new Map(state.pois);
      const poi = pois.get(id);
      if (poi) {
        pois.set(id, {
          ...poi,
          name: data.name !== undefined ? data.name : poi.name,
          description: data.description !== undefined ? data.description : poi.description,
          q: data.q !== undefined ? data.q : poi.q,
          r: data.r !== undefined ? data.r : poi.r
        });
      }
      return { ...state, pois };
    }),
    
    // Delete a POI
    deletePOI: (id: string) => update(state => {
      const pois = new Map(state.pois);
      pois.delete(id);
      return {
        ...state,
        pois,
        selectedPOI: null
      };
    }),
    
    // Select a POI by ID
    selectPOI: (id: string) => update(state => ({
      ...state,
      selectedPOI: id,
      selectedTiles: new Set(),
      selectedRegion: null
    })),
    
    // Import map data from MapData object
    importMapData: (data: MapData) => update(state => {
      const tiles = new Map<string, Tile>();
      const regions = new Map<string, Region>();
      const pois = new Map<string, POI>();
      
      // Import tiles
      data.tiles.forEach(tile => {
        const key = getTileKey(tile.q, tile.r);
        tiles.set(key, {
          q: tile.q,
          r: tile.r,
          assetId: tile.assetId
        });
      });
      
      // Import regions
      data.regions.forEach(region => {
        regions.set(region.id, {
          id: region.id,
          name: region.name,
          description: region.description,
          hexes: region.hexes
        });
      });
      
      // Import POIs
      data.pois.forEach(poi => {
        pois.set(poi.id, {
          id: poi.id,
          name: poi.name,
          description: poi.description,
          q: poi.q,
          r: poi.r,
          icon: poi.icon
        });
      });
      
      return {
        ...state,
        name: data.name,
        width: data.width,
        height: data.height,
        tiles,
        regions,
        pois,
        selectedTiles: new Set(),
        selectedRegion: null,
        selectedPOI: null
      };
    })
  };
}

// Create and export the store
export const mapStore = createMapStore();

// Create a derived store for map data that can be exported
export const exportableMapData = derived(mapStore, $mapStore => {
  const data: MapData = {
    name: $mapStore.name,
    width: $mapStore.width,
    height: $mapStore.height,
    tiles: [],
    regions: [],
    pois: []
  };
  
  // Convert tiles to array format
  $mapStore.tiles.forEach(tile => {
    data.tiles.push({
      q: tile.q,
      r: tile.r,
      assetId: tile.assetId
    });
  });
  
  // Convert regions to array format
  $mapStore.regions.forEach(region => {
    data.regions.push({
      id: region.id,
      name: region.name,
      description: region.description,
      hexes: region.hexes
    });
  });
  
  // Convert POIs to array format
  $mapStore.pois.forEach(poi => {
    data.pois.push({
      id: poi.id,
      name: poi.name,
      description: poi.description,
      q: poi.q,
      r: poi.r,
      icon: poi.icon
    });
  });
  
  return data;
});