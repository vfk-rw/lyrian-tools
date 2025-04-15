import { writable, get, derived } from 'svelte/store';
import { getHexKey, getHexesInRange, getHexCoordinatesFromKey } from '../utils/hexlib';
import { v4 as uuidv4 } from 'uuid';

// Define interfaces for the map data

export interface POI {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface Tile {
  q: number;
  r: number;
  biome: string;
  height?: number;
  pois: POI[];
}

export interface Region {
  id: string;
  name: string;
  color: string;
  tiles: Array<[number, number]>; // Array of [q, r] coordinates
}

export interface MapData {
  tiles: Map<string, Tile>;
  regions: Map<string, Region>;
  mapName: string;
}

// Create initial empty map data
const initialMapData: MapData = {
  tiles: new Map<string, Tile>(),
  regions: new Map<string, Region>(),
  mapName: 'New Map'
};

// Create map store
const createMapStore = () => {
  const { subscribe, update, set } = writable<MapData>(initialMapData);
  
  return {
    subscribe,
    
    // Add a tile to the map
    addTile: (tileData: Omit<Tile, 'pois'>) => {
      update(data => {
        const key = getHexKey(tileData.q, tileData.r);
        
        // If tile already exists, update it while preserving POIs
        const existingTile = data.tiles.get(key);
        const newTile: Tile = {
          ...tileData,
          pois: existingTile?.pois || []
        };
        
        data.tiles.set(key, newTile);
        return data;
      });
    },
    
    // Remove a tile from the map
    removeTile: (q: number, r: number) => {
      update(data => {
        const key = getHexKey(q, r);
        data.tiles.delete(key);
        
        // Also remove from any regions
        data.regions.forEach(region => {
          region.tiles = region.tiles.filter(([tq, tr]) => !(tq === q && tr === r));
        });
        
        return data;
      });
    },
    
    // Add a POI to a tile
    addPOI: (tileKey: string, poi: Omit<POI, 'id'>) => {
      const newPOI: POI = {
        id: uuidv4(),
        ...poi
      };
      
      update(data => {
        const tile = data.tiles.get(tileKey);
        if (tile) {
          tile.pois.push(newPOI);
        }
        return data;
      });
      
      return newPOI.id;
    },
    
    // Update an existing POI
    updatePOI: (tileKey: string, poi: POI) => {
      update(data => {
        const tile = data.tiles.get(tileKey);
        if (tile) {
          const poiIndex = tile.pois.findIndex(p => p.id === poi.id);
          if (poiIndex !== -1) {
            tile.pois[poiIndex] = poi;
          }
        }
        return data;
      });
    },
    
    // Remove a POI from a tile
    removePOI: (tileKey: string, poiId: string) => {
      update(data => {
        const tile = data.tiles.get(tileKey);
        if (tile) {
          tile.pois = tile.pois.filter(p => p.id !== poiId);
        }
        return data;
      });
    },
    
    // Update a tile's biome
    updateBiome: (tileKey: string, biome: string) => {
      update(data => {
        const tile = data.tiles.get(tileKey);
        if (tile) {
          tile.biome = biome;
        }
        return data;
      });
    },
    
    // Update a tile's height
    updateHeight: (tileKey: string, height: number) => {
      update(data => {
        const tile = data.tiles.get(tileKey);
        if (tile) {
          tile.height = height;
        }
        return data;
      });
    },
    
    // Add a new region
    addRegion: (region: Omit<Region, 'id'> & { id?: string }) => {
      const regionId = region.id || uuidv4();
      
      update(data => {
        data.regions.set(regionId, {
          id: regionId,
          name: region.name,
          color: region.color,
          tiles: [...region.tiles]
        });
        return data;
      });
      
      return regionId;
    },
    
    // Update a region
    updateRegion: (regionId: string, updates: Partial<Omit<Region, 'id'>>) => {
      update(data => {
        const region = data.regions.get(regionId);
        if (region) {
          if (updates.name) region.name = updates.name;
          if (updates.color) region.color = updates.color;
          if (updates.tiles) region.tiles = [...updates.tiles];
        }
        return data;
      });
    },
    
    // Remove a region
    removeRegion: (regionId: string) => {
      update(data => {
        data.regions.delete(regionId);
        return data;
      });
    },
    
    // Update map name
    setMapName: (name: string) => {
      update(data => {
        data.mapName = name;
        return data;
      });
    },
    
    // Generate a grid of hexagons
    generateHexGrid: (size: number, centerBiome = 'plains') => {
      update(data => {
        // Clear existing data
        data.tiles.clear();
        data.regions.clear();
        
        // Generate grid
        const hexes = getHexesInRange(0, 0, size);
        
        // Create tiles for each hex
        hexes.forEach(([q, r]) => {
          // Determine biome type based on distance from center
          const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q-r));
          let biome = centerBiome;
          
          // Simple biome distribution for testing
          if (distance > size * 0.8) {
            biome = 'mountain';
          } else if (distance > size * 0.6) {
            biome = 'forest';
          } else if (distance > size * 0.4) {
            biome = 'plains';
          } else if (distance > size * 0.2) {
            biome = 'desert';
          } else {
            biome = 'water';
          }
          
          // Calculate a simple height based on distance from center
          const height = Math.floor((size - distance) / size * 10);
          
          // Create the tile
          const key = getHexKey(q, r);
          data.tiles.set(key, {
            q, r, biome, height, pois: []
          });
        });
        
        return data;
      });
    },
    
    // Export map to JSON
    exportMapJSON: () => {
      const data = get(mapData);
      
      // Convert Maps to arrays for JSON serialization
      return {
        mapName: data.mapName,
        tiles: Array.from(data.tiles.values()).map(tile => ({
          ...tile,
          pois: [...tile.pois]
        })),
        regions: Array.from(data.regions.values())
      };
    },
    
    // Import map from JSON
    importMapJSON: (json: any): boolean => {
      try {
        if (!json || !Array.isArray(json.tiles)) {
          return false;
        }
        
        const newData: MapData = {
          mapName: json.mapName || 'Imported Map',
          tiles: new Map(),
          regions: new Map()
        };
        
        // Import tiles
        json.tiles.forEach((tile: any) => {
          if (typeof tile.q === 'number' && typeof tile.r === 'number') {
            const key = getHexKey(tile.q, tile.r);
            newData.tiles.set(key, {
              q: tile.q,
              r: tile.r,
              biome: tile.biome || 'plains',
              height: tile.height,
              pois: Array.isArray(tile.pois) ? [...tile.pois] : []
            });
          }
        });
        
        // Import regions
        if (Array.isArray(json.regions)) {
          json.regions.forEach((region: any) => {
            if (region.id && region.name && Array.isArray(region.tiles)) {
              newData.regions.set(region.id, {
                id: region.id,
                name: region.name,
                color: region.color || '#ff0000',
                tiles: [...region.tiles]
              });
            }
          });
        }
        
        set(newData);
        return true;
        
      } catch (error) {
        console.error('Error importing map:', error);
        return false;
      }
    }
  };
};

// Create and export the store
export const mapStore = createMapStore();

// Export the data itself as a readable store
export const mapData = {
  subscribe: mapStore.subscribe
};

// Derived stores for specific map data
export const tilesList = derived(mapData, $mapData => 
  Array.from($mapData.tiles.values())
);

export const regionsList = derived(mapData, $mapData => 
  Array.from($mapData.regions.values())
);

// Export specific actions for convenience
export const { 
  addTile, 
  removeTile, 
  addPOI, 
  updatePOI, 
  removePOI, 
  updateBiome, 
  updateHeight, 
  addRegion, 
  updateRegion, 
  removeRegion, 
  setMapName, 
  generateHexGrid, 
  exportMapJSON, 
  importMapJSON 
} = mapStore;
