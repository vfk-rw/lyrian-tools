import { defineHex, Grid, Orientation, rectangle } from 'honeycomb-grid';
import type { Point, HexCoordinates } from 'honeycomb-grid';
import { mapData, getTileKey, type TileHex } from '../stores/mapStore';
import { get } from 'svelte/store';

// Define the hex size and orientation
const HEX_SIZE = 10;

// Define our custom hex class with additional properties
const BaseHex = defineHex({
  dimensions: { xRadius: HEX_SIZE, yRadius: HEX_SIZE },
  orientation: Orientation.POINTY
});

export class MapHex extends BaseHex {
  biome: string;
  elevation: number;
  pois: any[];
  regionId: string | null;
  
  constructor(coordinates?: HexCoordinates) {
    super(coordinates);
    this.biome = 'plains';
    this.elevation = 0;
    this.pois = [];
    this.regionId = null;
  }
}

// Our grid instance
let hexGrid: Grid<MapHex>;

// Initialize the map with a rectangle of hexes
export function initializeMap(width: number = 10, height: number = 10): void {
  // Create a new grid with the specified dimensions
  hexGrid = new Grid(MapHex, rectangle({ width, height }));
  
  // Update the mapData store with the new grid
  const mapDataValue = get(mapData);
  const newTiles = new Map<string, TileHex>();
  
  hexGrid.forEach(hex => {
    const center = hex.center;
    const key = getTileKey(hex.q, hex.r);
    
    // Create a tile with calculated x,y coordinates
    const tile: TileHex = {
      q: hex.q,
      r: hex.r,
      s: hex.s,
      x: center.x,
      y: center.y,
      biome: 'plains',
      height: 0,
      pois: [],
      regionId: null
    };
    
    newTiles.set(key, tile);
  });
  
  // Update the store
  mapData.update(state => ({
    ...state,
    tiles: newTiles
  }));
}

// Convert hex coordinates to screen coordinates
export function hexToScreen(q: number, r: number): Point {
  if (!hexGrid) {
    // If grid isn't initialized, create a temporary hex to get coordinates
    const tempHex = new MapHex({ q, r });
    return tempHex.center;
  }
  
  // Find the hex in the grid
  const hex = hexGrid.getHex({ q, r }) || new MapHex({ q, r });
  return hex.center;
}

// Get the corners of a hex for rendering
export function getHexCorners(q: number, r: number): { x: number, y: number }[] {
  if (!hexGrid) {
    // If grid isn't initialized, create a temporary hex
    const tempHex = new MapHex({ q, r });
    const corners = tempHex.corners;
    return corners.map((corner: Point) => ({ x: corner.x, y: corner.y }));
  }
  
  // Find the hex in the grid
  const hex = hexGrid.getHex({ q, r }) || new MapHex({ q, r });
  const corners = hex.corners;
  
  // Map the corners to a simple format
  return corners.map((corner: Point) => ({ x: corner.x, y: corner.y }));
}

// Find a hex at screen coordinates
export function screenToHex(x: number, y: number): MapHex | undefined {
  if (!hexGrid) return undefined;
  
  const point = { x, y };
  return hexGrid.pointToHex(point);
}

// Get all neighboring hexes
export function getNeighbors(q: number, r: number): MapHex[] {
  if (!hexGrid) return [];
  
  const hex = hexGrid.getHex({ q, r });
  if (!hex) return [];
  
  // Get all 6 neighboring coordinates
  const directions = [
    { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
    { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
  ];
  
  const neighbors: MapHex[] = [];
  for (const dir of directions) {
    const neighborCoord = { q: hex.q + dir.q, r: hex.r + dir.r };
    const neighbor = hexGrid.getHex(neighborCoord);
    if (neighbor) {
      neighbors.push(neighbor);
    }
  }
  
  return neighbors;
}

// Function to calculate distance between two hexes
export function hexDistance(q1: number, r1: number, q2: number, r2: number): number {
  return Math.max(Math.abs(q1 - q2), Math.abs(r1 - r2), Math.abs(-q1 - r1 + q2 + r2)) / 2;
}

// Convert screen coordinates to a serialized hex key
export function pointToHexKey(x: number, y: number): string | null {
  const hex = screenToHex(x, y);
  if (!hex) return null;
  
  return getTileKey(hex.q, hex.r);
}

// Calculate the center point of a hex for positioning
export function getHexCenter(q: number, r: number): { x: number, y: number, z: number } {
  const point = hexToScreen(q, r);
  return { x: point.x, y: 0, z: point.y };
}

// Resize the grid (add/remove hexes)
export function resizeGrid(newWidth: number, newHeight: number): void {
  // Create a new grid with the specified dimensions
  const newGrid = new Grid(MapHex, rectangle({ width: newWidth, height: newHeight }));
  
  // Update the hexGrid reference
  hexGrid = newGrid;
  
  // Update the mapData store with the new grid
  const mapDataValue = get(mapData);
  const newTiles = new Map<string, TileHex>();
  
  // Preserve existing tiles when possible
  newGrid.forEach(hex => {
    const center = hex.center;
    const key = getTileKey(hex.q, hex.r);
    const existingTile = mapDataValue.tiles.get(key);
    
    if (existingTile) {
      // Keep the existing tile data
      newTiles.set(key, existingTile);
    } else {
      // Create a new tile
      const tile: TileHex = {
        q: hex.q,
        r: hex.r,
        s: hex.s,
        x: center.x,
        y: center.y,
        biome: 'plains',
        height: 0,
        pois: [],
        regionId: null
      };
      
      newTiles.set(key, tile);
    }
  });
  
  // Update the store
  mapData.update(state => ({
    ...state,
    tiles: newTiles
  }));
}
