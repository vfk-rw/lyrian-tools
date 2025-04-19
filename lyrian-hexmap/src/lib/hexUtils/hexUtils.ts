import { defineHex, Grid, rectangle, Orientation, spiral } from 'honeycomb-grid';
import type { Point } from 'honeycomb-grid';

// Define the Hex factory using Honeycomb's API
export const Hex = defineHex({
  dimensions: { xRadius: 64, yRadius: 64 }, // For 256x256 hex tiles
  orientation: Orientation.POINTY, // pointy-top orientation
  origin: { x: 0, y: 0 }
});

// Type alias for our specific Hex type
export type HexType = InstanceType<typeof Hex>;

// Utility type for hex coordinates
export type HexCoords = { q: number; r: number };

// Create a grid with specified dimensions
export function createGrid(width: number, height: number): Grid<HexType> {
  return new Grid(Hex, rectangle({ width, height }));
}

// Convert pixel coordinates to hex coordinates
export function pointToHex(grid: Grid<HexType>, x: number, y: number): HexType | undefined {
  return grid.pointToHex({ x, y }, { allowOutside: false });
}

// Get neighbors of a hex within a certain radius using spiral traverser
export function getNeighborsInRadius(grid: Grid<HexType>, hex: HexType, radius: number): HexType[] {
  // Create a grid from the spiral traverser
  // This creates a spiral of hexes from the center hex to the specified radius
  const spiralGrid = new Grid(Hex, spiral({ start: hex, radius }));
  
  // Filter to only include hexes that exist in the grid
  return Array.from(spiralGrid)
    .map(spiralHex => grid.getHex(spiralHex))
    .filter((h): h is HexType => h !== undefined);
}

// Get hexes in range (alias for getNeighborsInRadius for backward compatibility)
export function hexesInRange(grid: Grid<HexType>, centerHex: HexType, radius: number): HexType[] {
  return getNeighborsInRadius(grid, centerHex, radius);
}

// Calculate distance between two hexes (using cube coordinates)
export function hexDistance(a: HexCoords, b: HexCoords): number {
  // Convert from axial to cube coordinates
  const ac = { q: a.q, r: a.r, s: -a.q - a.r };
  const bc = { q: b.q, r: b.r, s: -b.q - b.r };
  
  return Math.max(
    Math.abs(ac.q - bc.q),
    Math.abs(ac.r - bc.r),
    Math.abs(ac.s - bc.s)
  );
}

// Find the centroid of a region (average position of hexes)
export function findRegionCentroid(hexes: HexCoords[]): Point {
  if (!hexes.length) return { x: 0, y: 0 };
  
  const hexInstances = hexes.map(coords => new Hex(coords));
  const sumPoint = hexInstances.reduce(
    (sum, hex) => {
      return { x: sum.x + hex.x, y: sum.y + hex.y };
    },
    { x: 0, y: 0 }
  );
  
  return { 
    x: sumPoint.x / hexes.length, 
    y: sumPoint.y / hexes.length 
  };
}

// Create a hex with the given coordinates
export function createHex(q: number, r: number): HexType {
  return new Hex({ q, r });
}

// Utility to get hex at specific coordinates
export function getHexAt(grid: Grid<HexType>, q: number, r: number): HexType | undefined {
  return grid.getHex({ q, r });
}

// Serialize a grid to JSON
export function gridToJSON(grid: Grid<HexType>) {
  return grid.toJSON();
}

// Create a grid from JSON
export function gridFromJSON(json: any): Grid<HexType> {
  return Grid.fromJSON(json, (coords) => new Hex(coords));
}