// @ts-check
import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream } from 'fs';
import { promisify } from 'util';

/**
 * Simple PNG dimension reader that reads image width/height from the IHDR chunk
 * @param {string} filePath - Path to PNG file
 * @returns {Promise<{width: number, height: number}>}
 */
async function getPngDimensions(filePath) {
  return new Promise((resolve, reject) => {
    const stream = createReadStream(filePath, { start: 16, end: 24 });
    const chunks = [];
    
    stream.on('data', chunk => chunks.push(chunk));
    
    stream.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        // PNG stores dimensions as 4 bytes each for width and height
        const width = buffer.readUInt32BE(0);
        const height = buffer.readUInt32BE(4);
        resolve({ width, height });
      } catch (err) {
        // Default to full size if we can't read dimensions
        resolve({ width: 256, height: 256 });
      }
    });
    
    stream.on('error', () => {
      // Default to full size on error
      resolve({ width: 256, height: 256 });
    });
  });
}

/**
 * Recursively scans directories for PNG files
 * @param {string} dir - Directory to scan
 * @param {string} baseDir - Base directory for relative paths
 * @returns {Promise<Array<{id: string, path: string, category: string, name: string, width: number, height: number, isSmall: boolean}>>}
 */
async function scanTiles(dir, baseDir) {
  const tiles = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    
    if (entry.isDirectory()) {
      const subDirTiles = await scanTiles(fullPath, baseDir);
      tiles.push(...subDirTiles);
    } else if (entry.name.toLowerCase().endsWith('.png')) {
      // Extract category from path
      const pathParts = relativePath.split('/');
      const category = pathParts[1]; // The directory name inside Tile_Samples
      
      // Create a clean name from the filename
      const name = entry.name.replace('.png', '')
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .trim();
      
      // Get image dimensions
      const { width, height } = await getPngDimensions(fullPath);
      
      // Determine if this is a "small" tile that should be centered
      // Consider any tile less than 200px in either dimension as "small"
      const isSmall = width < 200 || height < 200;
      
      tiles.push({
        id: relativePath,
        path: '/' + relativePath,
        category,
        name,
        width,
        height,
        isSmall
      });
    }
  }
  
  return tiles;
}

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  const staticDir = path.resolve('static');
  const tilesDir = path.join(staticDir, 'tiles', 'Tile_Samples');
  
  try {
    const tiles = await scanTiles(tilesDir, staticDir);
    
    // Group tiles by category
    /** @type {Record<string, {name: string, tiles: Array<{id: string, path: string, category: string, name: string, width: number, height: number, isSmall: boolean}>}>} */
    const tilesByCategory = {};
    
    tiles.forEach(tile => {
      if (!tilesByCategory[tile.category]) {
        tilesByCategory[tile.category] = {
          name: tile.category?.replace('Tile_', '').replace(/_/g, ' ') || 'Unknown',
          tiles: []
        };
      }
      tilesByCategory[tile.category].tiles.push(tile);
    });
    
    return {
      categories: Object.values(tilesByCategory)
    };
  } catch (err) {
    console.error('Error scanning tiles:', err);
    return {
      categories: []
    };
  }
}