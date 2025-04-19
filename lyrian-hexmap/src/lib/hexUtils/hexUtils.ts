import { defineHex, Grid, rectangle, Orientation, spiral } from 'honeycomb-grid';
import type { Point } from 'honeycomb-grid';

// Base hex size - fine-tuned for perfect alignment with 256x256 hex PNGs
const HEX_SIZE = 138;

// Define a hex factory with a custom projection angle and size
function createHexFactory(projectionAngle: number, customSize?: number) {
  const size = customSize || HEX_SIZE;
  
  // Calculate the y-radius based on the projection angle (0-60)
  // For 0 degrees (top-down), yRadius = xRadius (equilateral)
  // For 45 degrees, use the 45-degree formula
  // For 60 degrees, use the 60-degree formula
  // For angles in between, interpolate
  
  let yFactor: number;
  
  if (projectionAngle <= 0) {
    // 0 degrees - equilateral
    yFactor = 1;
  } else if (projectionAngle >= 60) {
    // 60 degrees
    yFactor = (2 * Math.sqrt(3/4)) / Math.sqrt(3);
  } else if (projectionAngle === 45) {
    // 45 degrees
    yFactor = (2 * Math.sqrt(3/8)) / Math.sqrt(3);
  } else if (projectionAngle < 45) {
    // Interpolate between 0 and 45 degrees
    const factor45 = (2 * Math.sqrt(3/8)) / Math.sqrt(3);
    yFactor = 1 + (projectionAngle / 45) * (factor45 - 1);
  } else {
    // Interpolate between 45 and 60 degrees
    const factor45 = (2 * Math.sqrt(3/8)) / Math.sqrt(3);
    const factor60 = (2 * Math.sqrt(3/4)) / Math.sqrt(3);
    yFactor = factor45 + ((projectionAngle - 45) / 15) * (factor60 - factor45);
  }
  
  return defineHex({
    dimensions: { 
      xRadius: size, 
      yRadius: size * yFactor
    },
    orientation: Orientation.POINTY,
    origin: { x: 0, y: 0 }
  });
}

// Type alias for our hex type
export type HexType = ReturnType<typeof createHexFactory> extends new (...args: any[]) => infer T ? T : never;

// Utility type for hex coordinates
export type HexCoords = { q: number; r: number };

// Create a grid with specified dimensions, projection angle, and optional custom hex size
export function createGrid(width: number, height: number, projectionAngle: number = 45, customSize?: number): Grid<HexType> {
  const HexFactory = createHexFactory(projectionAngle, customSize);
  return new Grid(HexFactory, rectangle({ width, height }));
}

// Define a base hex factory for functions that don't need the projection
const BaseHex = createHexFactory(0);
export type BaseHexType = InstanceType<typeof BaseHex>;

// Convert pixel coordinates to hex coordinates
export function pointToHex(grid: Grid<HexType>, x: number, y: number): HexType | undefined {
  return grid.pointToHex({ x, y }, { allowOutside: false });
}

// Get neighbors of a hex within a certain radius using spiral traverser
export function getNeighborsInRadius(grid: Grid<HexType>, hex: HexType, radius: number): HexType[] {
  // Create a grid from the spiral traverser
  // This creates a spiral of hexes from the center hex to the specified radius
  const spiralGrid = new Grid(BaseHex, spiral({ start: hex, radius }));
  
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
  
  const hexInstances = hexes.map(coords => new BaseHex(coords));
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
  return new BaseHex({ q, r });
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
  return Grid.fromJSON(json, (coords) => new BaseHex(coords));
}