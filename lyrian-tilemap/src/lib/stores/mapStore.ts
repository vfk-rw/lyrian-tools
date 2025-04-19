import { writable, derived } from 'svelte/store';
import type { MapData, MapCell } from '$lib/types';

// Default map dimensions
const DEFAULT_WIDTH = 20;
const DEFAULT_HEIGHT = 15;

function createMapStore() {
  // Create initial map data
  const initialMap: MapData = {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    cells: {}
  };

  const { subscribe, set, update } = writable<MapData>(initialMap);

  return {
    subscribe,
    
    // Reset map to empty state
    reset: (width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT) => {
      set({ width, height, cells: {} });
    },
    
    // Add a tile to a cell
    addTile: (x: number, y: number, tileId: string) => {
      update(map => {
        const key = `${x},${y}`;
        const cell = map.cells[key] || { x, y, tiles: [] };
        
        // Avoid duplicate tiles
        if (!cell.tiles.includes(tileId)) {
          cell.tiles.push(tileId);
        }
        
        return { 
          ...map, 
          cells: { ...map.cells, [key]: cell } 
        };
      });
    },
    
    // Remove a tile from a cell
    removeTile: (x: number, y: number, tileId: string) => {
      update(map => {
        const key = `${x},${y}`;
        const cell = map.cells[key];
        
        if (cell) {
          cell.tiles = cell.tiles.filter(id => id !== tileId);
          
          // If cell is empty, remove it completely
          if (cell.tiles.length === 0) {
            const newCells = { ...map.cells };
            delete newCells[key];
            return { ...map, cells: newCells };
          }
          
          return { 
            ...map, 
            cells: { ...map.cells, [key]: cell } 
          };
        }
        
        return map;
      });
    },
    
    // Clear a cell (remove all tiles)
    clearCell: (x: number, y: number) => {
      update(map => {
        const key = `${x},${y}`;
        const newCells = { ...map.cells };
        delete newCells[key];
        return { ...map, cells: newCells };
      });
    },
    
    // Resize the map
    resize: (width: number, height: number) => {
      update(map => {
        // Remove cells outside new bounds
        const newCells = { ...map.cells };
        for (const key in newCells) {
          const [cellX, cellY] = key.split(',').map(Number);
          if (cellX >= width || cellY >= height) {
            delete newCells[key];
          }
        }
        return { width, height, cells: newCells };
      });
    },
    
    // Import map data
    importMap: (mapData: MapData) => {
      // Basic validation
      if (typeof mapData !== 'object' ||
          !('width' in mapData) || 
          !('height' in mapData) ||
          !('cells' in mapData) ||
          typeof mapData.width !== 'number' ||
          typeof mapData.height !== 'number' ||
          typeof mapData.cells !== 'object') {
        throw new Error('Invalid map data format');
      }
      
      set(mapData);
    }
  };
}

// Create and export the map store
export const mapStore = createMapStore();

// Derived store to get a cell at specific coordinates
export function getCell(x: number, y: number) {
  return derived(mapStore, $mapStore => {
    const key = `${x},${y}`;
    return $mapStore.cells[key] || { x, y, tiles: [] };
  });
}