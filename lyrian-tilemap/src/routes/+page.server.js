// @ts-check
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Recursively scans directories for PNG files
 * @param {string} dir - Directory to scan
 * @param {string} baseDir - Base directory for relative paths
 * @returns {Promise<Array<{id: string, path: string, category: string, name: string}>>}
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
      
      tiles.push({
        id: relativePath,
        path: '/' + relativePath,
        category,
        name
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
    /** @type {Record<string, {name: string, tiles: Array<{id: string, path: string, category: string, name: string}>}>} */
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