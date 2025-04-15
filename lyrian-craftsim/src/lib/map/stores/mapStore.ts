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
  icon?: string | null; // Path to the icon SVG file or null if no icon
}

export interface Region {
  id: string;
  name: string;
  color: string;
  description?: string;
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
    
    // Update a tile's icon
    updateTileIcon: (tileKey: string, iconPath: string | null) => {
      update(data => {
        const tile = data.tiles.get(tileKey);
        if (tile) {
          tile.icon = iconPath;
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
          description: region.description,
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
          if (updates.description !== undefined) region.description = updates.description;
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
    
    // Generate a 30x30 grid of hexagons with unexplored biome and flat height 0
    generateHexGrid: () => {
      update(data => {
        // Clear existing data
        data.tiles.clear();
        data.regions.clear();
        
        // Generate a grid that's approximately 30x30
        // For a hex grid, we'll create a radius 15 grid from center which should give us about 30x30
        const hexes = getHexesInRange(0, 0, 15);
        
        // Create tiles for each hex with unexplored biome and height 0
        hexes.forEach(([q, r]) => {
          // All tiles are unexplored and flat
          const biome = 'unexplored';
          const height = 0;
          
          // Create the tile
          const key = getHexKey(q, r);
          data.tiles.set(key, {
            q, r, biome, height, icon: null, pois: []
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
        json.tiles.forEach((tile: Tile) => {
          if (typeof tile.q === 'number' && typeof tile.r === 'number') {
            const key = getHexKey(tile.q, tile.r);
            newData.tiles.set(key, {
              q: tile.q,
              r: tile.r,
              biome: tile.biome || 'plains',
              height: tile.height,
              icon: tile.icon, 
              pois: Array.isArray(tile.pois) ? [...tile.pois] : []
            });
          }
        });
        
        // Import regions
        if (Array.isArray(json.regions)) {
          json.regions.forEach((region: Region) => {
            if (region.id && region.name && Array.isArray(region.tiles)) {
              newData.regions.set(region.id, {
                id: region.id,
                name: region.name,
                color: region.color || '#ff0000',
                description: region.description,
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

// Load demo map from file
import demoMapData from '../data/demo-mirane-map.json';
import { validateAndSanitizeMapJSON } from '../utils/secureImport';

// Function to load the demo map
const loadDemoMap = () => {
  try {
    // Validate and sanitize the demo map data
    // Using a reasonable file size since it's a static file
    const demoMapSize = JSON.stringify(demoMapData).length;
    const validationResult = validateAndSanitizeMapJSON(demoMapData, demoMapSize);
    
    if (validationResult.isValid) {
      importMapJSON(validationResult.sanitizedData);
      console.log('Demo map loaded successfully');
    } else {
      console.error('Demo map validation failed:', validationResult.error);
      alert('Failed to load demo map: ' + validationResult.error);
    }
  } catch (error) {
    console.error('Error loading demo map:', error);
    alert('Error loading demo map. Please try again.');
  }
};

// Export specific actions for convenience
export const { 
  addTile, 
  removeTile, 
  addPOI, 
  updatePOI, 
  removePOI, 
  updateBiome, 
  updateHeight, 
  updateTileIcon,
  addRegion, 
  updateRegion, 
  removeRegion, 
  setMapName, 
  generateHexGrid, 
  exportMapJSON, 
  importMapJSON 
} = mapStore;

// Export the loadDemoMap function
export { loadDemoMap };
