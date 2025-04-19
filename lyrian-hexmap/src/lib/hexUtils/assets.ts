/**
 * Hex Asset Manager
 * 
 * Loads and organizes hex PNG assets from the static directory based on
 * the content of the hex_png_list.txt file.
 */

// Interface definitions for hex assets
export interface HexAssetCategory {
  name: string;
  assets: HexAsset[];
}

export interface HexAsset {
  id: string;
  name: string;
  path: string;
  category: string;
  filename: string;
}

// Root path for hex PNG assets in static directory
const HEX_PNG_BASE_PATH = '/hex_png_256x256';

/**
 * Parse the hex_png_list.txt content to extract categories and assets
 */
function parseHexAssetList(content: string): HexAssetCategory[] {
  const categories: HexAssetCategory[] = [];
  let currentCategory: HexAssetCategory | null = null;
  
  // Split content by line and process each line
  const lines = content.split('\n');
  
  // Debug the first 20 lines to understand the format
  console.log("Analyzing first 20 lines of content:");
  lines.slice(0, 20).forEach((line, i) => {
    console.log(`Line ${i}: [${line}]`);
  });
  
  // Skip the first line which is just the root directory name
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Check if it's a category header (directory)
    if (line.startsWith('├── ') || line.startsWith('└── ')) {
      const categoryName = line.replace(/^[├└]── /, '');
      
      // Only create a category for directories (not individual files)
      if (!categoryName.endsWith('.png')) {
        currentCategory = {
          name: categoryName,
          assets: []
        };
        categories.push(currentCategory);
        console.log(`Found category: ${categoryName}`);
      }
    } 
    // Check if it's an asset file (PNG)
    else if (currentCategory) {
      // More flexible pattern to match PNG files regardless of prefix structure
      if (line.includes('── ') && line.endsWith('.png')) {
        const filename = line.substring(line.lastIndexOf('── ') + 3);
        
        // Create the asset
        const assetPath = `${HEX_PNG_BASE_PATH}/${currentCategory.name}/${filename}`;
        const assetName = filename.replace('.png', '');
        
        currentCategory.assets.push({
          id: `${currentCategory.name}-${assetName}`,
          name: assetName,
          path: assetPath,
          category: currentCategory.name,
          filename: filename
        });
        console.log(`Added asset: ${filename} to category ${currentCategory.name}`);
      }
    }
  }
  
  return categories;
}

/**
 * Load hex assets from the hex_png_list.txt static file
 */
export async function loadHexAssets(): Promise<HexAssetCategory[]> {
  try {
    console.log("Fetching hex_png_list.txt...");
    const response = await fetch('/hex_png_list.txt');
    if (!response.ok) {
      console.error(`Failed to load hex_png_list.txt - Status: ${response.status}`);
      return [];
    }
    
    const content = await response.text();
    console.log("Content length:", content.length);
    console.log("First few lines:", content.split('\n').slice(0, 5).join('\n'));
    
    const categories = parseHexAssetList(content);
    console.log(`Parsed ${categories.length} categories with ${categories.reduce((sum, cat) => sum + cat.assets.length, 0)} total assets`);
    
    // Log the first asset of each category as a sample
    categories.forEach(cat => {
      if (cat.assets.length > 0) {
        console.log(`Category: ${cat.name}, Sample asset:`, cat.assets[0]);
      }
    });
    
    return categories;
  } catch (error) {
    console.error('Error loading hex assets:', error);
    return [];
  }
}

/**
 * Get all hex assets as a flat array
 */
export function getAllHexAssets(categories: HexAssetCategory[]): HexAsset[] {
  return categories.flatMap(category => category.assets);
}

/**
 * Find an asset by its ID
 */
export function getHexAssetById(categories: HexAssetCategory[], id: string): HexAsset | undefined {
  return getAllHexAssets(categories).find(asset => asset.id === id);
}

/**
 * Find an asset by its name (searches across all categories)
 */
export function findHexAssetByName(categories: HexAssetCategory[], name: string): HexAsset | undefined {
  return getAllHexAssets(categories).find(asset => asset.name === name);
}

/**
 * Get all hex assets from a specific category
 */
export function getHexAssetsByCategory(categories: HexAssetCategory[], categoryName: string): HexAsset[] {
  const category = categories.find(c => c.name === categoryName);
  return category ? category.assets : [];
}

/**
 * Get a random hex asset from a specific category
 */
export function getRandomHexAsset(categories: HexAssetCategory[], categoryName: string): HexAsset | undefined {
  const assets = getHexAssetsByCategory(categories, categoryName);
  if (!assets.length) return undefined;
  
  const randomIndex = Math.floor(Math.random() * assets.length);
  return assets[randomIndex];
}

/**
 * Get all category names
 */
export function getHexCategoryNames(categories: HexAssetCategory[]): string[] {
  return categories.map(category => category.name);
}

// Sample default hex asset path for testing
export const DEFAULT_HEX_ASSET = `${HEX_PNG_BASE_PATH}/Hex Basic Terrain Set/hexPlains00.png`;

// Default export for convenience
export default {
  loadHexAssets,
  getAllHexAssets,
  getHexAssetById,
  findHexAssetByName,
  getHexAssetsByCategory,
  getRandomHexAsset,
  getHexCategoryNames,
  DEFAULT_HEX_ASSET
};