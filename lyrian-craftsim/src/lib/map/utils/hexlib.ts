/**
 * Utility functions for hexagonal grid operations
 * Based on the concepts from https://www.redblobgames.com/grids/hexagons/
 */

// Constants for hex grid dimensions
const HEX_SIZE = 50; // Size of a hex (from center to corner)
const HEX_WIDTH = HEX_SIZE * Math.sqrt(3);
const HEX_HEIGHT = HEX_SIZE * 2;
const HEX_VERTICAL_SPACING = HEX_HEIGHT * 0.75;
const HEX_HORIZONTAL_SPACING = HEX_WIDTH;

// Isometric projection factors
const ISO_SCALE_X = 0.866; // cos(30°)
const ISO_SCALE_Y = 0.5;   // sin(30°)
const ISO_SKEW = 0.577;    // tan(30°)

/**
 * Convert hex coordinates (q,r) to pixel position in flat-top orientation
 */
export function hexToPixel(q: number, r: number): { x: number, y: number } {
  const x = HEX_SIZE * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
  const y = HEX_SIZE * (3/2 * r);
  
  return { x, y };
}

/**
 * Convert hex coordinates to isometric pixel position for rendering
 */
export function hexToIsometric(q: number, r: number): { x: number, y: number } {
  const { x: flatX, y: flatY } = hexToPixel(q, r);
  
  // Apply isometric transformation
  const isoX = flatX * ISO_SCALE_X - flatY * ISO_SCALE_X;
  const isoY = flatX * ISO_SCALE_Y + flatY * ISO_SCALE_Y;
  
  return { x: isoX, y: isoY };
}

/**
 * Convert pixel position to hex coordinates (cube coordinates)
 */
export function pixelToHex(x: number, y: number): { q: number, r: number, s: number } {
  const q = (x * Math.sqrt(3)/3 - y/3) / HEX_SIZE;
  const r = y * 2/3 / HEX_SIZE;
  const s = -q - r; // Cube coordinate constraint: q + r + s = 0
  
  return cubeRound(q, r, s);
}

/**
 * Convert isometric pixel position to hex coordinates
 */
export function isometricToHex(x: number, y: number): { q: number, r: number } {
  // Convert isometric coordinates back to flat coordinates
  const flatX = (x / ISO_SCALE_X + y / ISO_SCALE_Y) / 2;
  const flatY = (y / ISO_SCALE_Y - x / ISO_SCALE_X) / 2;
  
  // Now convert flat coordinates to hex
  const { q, r } = pixelToHex(flatX, flatY);
  return { q, r };
}

/**
 * Convert isometric pixel position to hex key string
 */
export function isometricPointToHexKey(x: number, y: number): string {
  const { q, r } = isometricToHex(x, y);
  const roundedQ = Math.round(q);
  const roundedR = Math.round(r);
  return `${roundedQ},${roundedR}`;
}

/**
 * Round floating point cube coordinates to integer cube coordinates
 */
function cubeRound(q: number, r: number, s: number): { q: number, r: number, s: number } {
  let roundQ = Math.round(q);
  let roundR = Math.round(r);
  let roundS = Math.round(s);
  
  const qDiff = Math.abs(roundQ - q);
  const rDiff = Math.abs(roundR - r);
  const sDiff = Math.abs(roundS - s);
  
  // Adjust to maintain q + r + s = 0
  if (qDiff > rDiff && qDiff > sDiff) {
    roundQ = -roundR - roundS;
  } else if (rDiff > sDiff) {
    roundR = -roundQ - roundS;
  } else {
    roundS = -roundQ - roundR;
  }
  
  return { q: roundQ, r: roundR, s: roundS };
}

/**
 * Get all neighboring hex coordinates for a given hex
 */
export function getHexNeighbors(q: number, r: number): Array<[number, number]> {
  // Directions for flat-top hexagons (q, r directions)
  const directions = [
    [1, 0],   // East
    [1, -1],  // Northeast
    [0, -1],  // Northwest
    [-1, 0],  // West
    [-1, 1],  // Southwest
    [0, 1]    // Southeast
  ];
  
  return directions.map(([dq, dr]) => [q + dq, r + dr] as [number, number]);
}

/**
 * Calculate the boundary points of a region for drawing an outline
 */
export function calculateRegionBoundary(tiles: Array<[number, number]>): Array<{ x: number, y: number }> {
  if (tiles.length === 0) return [];
  
  // Initialize with the first tile's vertices
  const boundary: Array<{ x: number, y: number }> = [];
  
  // Implementation of a convex hull algorithm would go here
  // For simplicity, we'll just create a boundary by connecting 
  // the centers of the outermost hexes
  const sortedTiles = [...tiles].sort((a, b) => {
    // Sort by angle from the center of the region
    const centerQ = tiles.reduce((sum, [q]) => sum + q, 0) / tiles.length;
    const centerR = tiles.reduce((sum, [, r]) => sum + r, 0) / tiles.length;
    
    const angleA = Math.atan2(a[1] - centerR, a[0] - centerQ);
    const angleB = Math.atan2(b[1] - centerR, b[0] - centerQ);
    
    return angleA - angleB;
  });
  
  // Convert the sorted boundary tiles to pixel coordinates
  for (const [q, r] of sortedTiles) {
    const { x, y } = hexToIsometric(q, r);
    
    // Add hex vertex points
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const vx = x + HEX_SIZE * Math.cos(angle);
      const vy = y + HEX_SIZE * Math.sin(angle);
      
      // Only add points that are on the boundary
      // (This is a simplification, a real implementation would
      // need to check if a vertex is shared between hexes)
      boundary.push({ x: vx, y: vy });
    }
  }
  
  return boundary;
}

/**
 * Generate an SVG path string from boundary points
 */
export function generatePathFromPoints(points: Array<{ x: number, y: number }>): string {
  if (points.length === 0) return '';
  
  const firstPoint = points[0];
  let path = `M ${firstPoint.x},${firstPoint.y}`;
  
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x},${points[i].y}`;
  }
  
  // Close the path
  path += ' Z';
  
  return path;
}

/**
 * Get the vertices of a hex at a specific coordinate
 */
export function getHexVertices(q: number, r: number): Array<{ x: number, y: number }> {
  const { x, y } = hexToIsometric(q, r);
  const vertices = [];
  
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const vx = x + HEX_SIZE * Math.cos(angle);
    const vy = y + HEX_SIZE * Math.sin(angle);
    vertices.push({ x: vx, y: vy });
  }
  
  return vertices;
}

/**
 * Calculate the points of a hex for SVG drawing
 */
export function calculateHexPoints(q: number, r: number): string {
  const vertices = getHexVertices(q, r);
  return vertices.map(v => `${v.x},${v.y}`).join(' ');
}

/**
 * Alias for hexToPixel for consistency
 */
export function axialToPixel(q: number, r: number): { x: number, y: number } {
  return hexToPixel(q, r);
}

/**
 * Generate a key string from hex coordinates
 */
export function getHexKey(q: number, r: number): string {
  return `${q},${r}`;
}

/**
 * Parse a hex key string back into coordinates
 * @param key String in format "q,r"
 */
export function getHexCoordinatesFromKey(key: string): [number, number] {
  const [q, r] = key.split(',').map(Number);
  return [q, r];
}

/**
 * Get all hex coordinates within a certain range
 * @param centerQ Center hex Q coordinate
 * @param centerR Center hex R coordinate
 * @param range Range (distance from center)
 */
export function getHexesInRange(centerQ: number, centerR: number, range: number): Array<[number, number]> {
  const results: Array<[number, number]> = [];
  
  for (let q = centerQ - range; q <= centerQ + range; q++) {
    for (let r = centerR - range; r <= centerR + range; r++) {
      // Convert to cube coordinates to check distance
      const s = -q - r;
      // Calculate cube distance
      const distance = Math.max(Math.abs(q - centerQ), Math.abs(r - centerR), Math.abs(s - (-centerQ - centerR)));
      
      if (distance <= range) {
        results.push([q, r]);
      }
    }
  }
  
  return results;
}

/**
 * Check if a point is inside a hex
 */
export function isPointInHex(x: number, y: number, hexQ: number, hexR: number): boolean {
  const hexCenter = hexToIsometric(hexQ, hexR);
  
  // Calculate the distance from the center
  const dx = x - hexCenter.x;
  const dy = y - hexCenter.y;
  
  // Check if the point is within the hex boundaries
  // Simplified check using distance from center
  return Math.sqrt(dx * dx + dy * dy) <= HEX_SIZE;
}
