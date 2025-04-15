/**
 * Utility functions for hexagonal grid operations
 * Based on the concepts from https://www.redblobgames.com/grids/hexagons/
 */

// Constants for hex grid dimensions
const HEX_SIZE = 50; // Size from center to corner
const HEX_WIDTH = HEX_SIZE * 2; // Full width of a hex
const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE; // Height for flat-topped hex

// 60-degree projection factor
const PROJECTION_FACTOR = 0.5; // cos(60°) = 0.5

/**
 * Convert hex coordinates (q,r) to pixel position in flat-top orientation
 */
export function hexToPixel(q: number, r: number): { x: number, y: number } {
  // Coordinates for flat-topped hex
  const x = HEX_SIZE * (3/2 * q);
  const y = HEX_SIZE * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
  
  return { x, y };
}

/**
 * Convert hex coordinates to isometric pixel position for rendering
 * with proper 60° projection
 */
export function hexToIsometric(q: number, r: number): { x: number, y: number } {
  const { x, y } = hexToPixel(q, r);
  
  // Apply 60° projection by squashing the y coordinate
  const isoX = x;
  const isoY = y * PROJECTION_FACTOR;
  
  return { x: isoX, y: isoY };
}

/**
 * Convert pixel position to hex coordinates (cube coordinates)
 */
export function pixelToHex(x: number, y: number): { q: number, r: number, s: number } {
  // First adjust for the 60° projection
  const yAdjusted = y / PROJECTION_FACTOR;
  
  // Now do the inverse of hexToPixel
  const q = (2/3) * x / HEX_SIZE;
  const r = (-1/3 * x + Math.sqrt(3)/3 * yAdjusted) / HEX_SIZE;
  const s = -q - r; // Cube coordinate constraint: q + r + s = 0
  
  return cubeRound(q, r, s);
}

/**
 * Convert isometric pixel position to hex coordinates
 */
export function isometricToHex(x: number, y: number): { q: number, r: number } {
  // Adjust y for the 60° projection
  const yAdjusted = y / PROJECTION_FACTOR;
  
  // Use the adjusted y in the conversion
  const cube = pixelToHex(x, yAdjusted);
  return { q: cube.q, r: cube.r };
}

/**
 * More accurate check if a point is inside a specific hex
 */
export function isPointInHexPrecise(x: number, y: number, q: number, r: number): boolean {
  // Get the vertices of this hex
  const vertices = getHexVertices(q, r);
  
  // Use ray casting algorithm to determine if point is in polygon
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x, yi = vertices[i].y;
    const xj = vertices[j].x, yj = vertices[j].y;
    
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Convert isometric pixel position to hex key string with better precision
 */
export function isometricPointToHexKey(x: number, y: number): string {
  // First approximate with cube coordinates
  const { q, r } = isometricToHex(x, y);
  const approxQ = Math.round(q);
  const approxR = Math.round(r);
  
  // Check the candidate hex and its neighbors
  const neighbors = getHexNeighbors(approxQ, approxR);
  neighbors.unshift([approxQ, approxR]); // Add the approximate hex itself
  
  // Find the first hex that contains the point
  for (const [checkQ, checkR] of neighbors) {
    if (isPointInHexPrecise(x, y, checkQ, checkR)) {
      return `${checkQ},${checkR}`;
    }
  }
  
  // Fall back to the approximate hex if no precise match found
  return `${approxQ},${approxR}`;
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
 * Get the vertices of a hex at a specific coordinate
 * with proper 60° projection
 */
export function getHexVertices(q: number, r: number): Array<{ x: number, y: number }> {
  const { x, y } = hexToIsometric(q, r);
  const vertices = [];
  
  // Calculate corners of a flat-topped hex with 60° projection
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 3 * i;
    // Standard hex corner
    const cornerX = x + HEX_SIZE * Math.cos(angle);
    // Apply 60° projection to the y-component
    const cornerY = y + HEX_SIZE * Math.sin(angle) * PROJECTION_FACTOR;
    vertices.push({ x: cornerX, y: cornerY });
  }
  
  return vertices;
}

/**
 * Find the outer edges of a region for drawing the border
 * Returns an array of edge segments where each segment is represented by its two endpoints
 */
export function findRegionOuterEdges(tiles: Array<[number, number]>): Array<{
  start: { x: number, y: number },
  end: { x: number, y: number }
}> {
  if (tiles.length === 0) return [];
  
  // Convert tiles array to a Set for faster lookups
  const tileSet = new Set<string>(tiles.map(([q, r]) => `${q},${r}`));
  
  // Store the edges as segments (pairs of points)
  const edges: Array<{
    start: { x: number, y: number },
    end: { x: number, y: number }
  }> = [];
  
  // This mapping connects each neighbor direction to the correct vertex indices
  // For flat-top hexes with clockwise vertex order (from east)
  const directionToEdgeMap = [
    [0, 5], // East: vertices 0-5
    [5, 4], // Northeast: vertices 5-4 
    [4, 3], // Northwest: vertices 4-3
    [3, 2], // West: vertices 3-2
    [2, 1], // Southwest: vertices 2-1
    [1, 0]  // Southeast: vertices 1-0
  ];
  
  // Check each tile in the region
  for (const [q, r] of tiles) {
    // Get all neighbors
    const neighbors = getHexNeighbors(q, r);
    
    // Get the hex's vertices with proper isometric projection
    const vertices = getHexVertices(q, r);
    
    // For each of the 6 edges of the hex
    for (let i = 0; i < 6; i++) {
      // Calculate the neighbor's coordinates in this direction
      const [nq, nr] = neighbors[i];
      const neighborKey = `${nq},${nr}`;
      
      // If the neighbor is not in the region, this is an outer edge
      if (!tileSet.has(neighborKey)) {
        // Get the correct vertices using our mapping
        const [startIdx, endIdx] = directionToEdgeMap[i];
        const startVertex = vertices[startIdx];
        const endVertex = vertices[endIdx];
        
        edges.push({
          start: startVertex,
          end: endVertex
        });
      }
    }
  }
  
  return edges;
}

/**
 * Generate an SVG path string from a list of edge segments
 */
export function generateEdgePathFromSegments(edges: Array<{
  start: { x: number, y: number },
  end: { x: number, y: number }
}>): string {
  if (edges.length === 0) return '';
  
  let path = '';
  
  // Add each edge as a separate path segment
  for (const edge of edges) {
    path += `M ${edge.start.x},${edge.start.y} L ${edge.end.x},${edge.end.y} `;
  }
  
  return path;
}

/**
 * Calculate the boundary points of a region for drawing an outline
 * @deprecated Use findRegionOuterEdges instead for better edge detection
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
    
    // Add hex vertex points with 60° projection
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i;
      const vx = x + HEX_SIZE * Math.cos(angle);
      const vy = y + HEX_SIZE * Math.sin(angle) * PROJECTION_FACTOR;
      
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
 * Calculate the points of a hex for SVG drawing
 */
export function calculateHexPoints(q: number, r: number): string {
  const vertices = getHexVertices(q, r);
  return vertices.map(v => `${v.x},${v.y}`).join(' ');
}

/**
 * Generate a hex key string from hex coordinates
 */
export function getHexKey(q: number, r: number): string {
  return `${q},${r}`;
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
