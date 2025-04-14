import type { Mesh, Vector3 } from 'three';

export interface TileHex {
  q: number;
  r: number;
  s: number;
  x: number;
  y: number;
  height: number;
  biome: string;
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
  tiles: string[]; // Array of tile coordinate strings for region
}

export interface VisibilityCheck {
  mesh: Mesh;
  position: Vector3;
  key: string;
}

// Color conversion utility
export function colorToNumber(color: string): number {
  // Handle hex colors
  if (color.startsWith('#')) {
    return parseInt(color.slice(1), 16);
  }
  // Handle rgb/rgba colors
  if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g);
    if (matches && matches.length >= 3) {
      const [r, g, b] = matches.map(Number);
      return (r << 16) | (g << 8) | b;
    }
  }
  // Default to black if color format is not recognized
  return 0x000000;
}
