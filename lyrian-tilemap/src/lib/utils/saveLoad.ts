import type { MapData, MapCell } from '$lib/types';

/**
 * Saves map data to a downloadable JSON file
 * @param mapData The map data to save
 * @param filename The filename (without extension)
 */
export function saveMap(mapData: MapData, filename: string = 'tilemap'): void {
  // Validate map data
  if (!mapData || typeof mapData !== 'object') {
    throw new Error('Invalid map data');
  }
  
  // Convert to JSON string
  const json = JSON.stringify(mapData, null, 2);
  
  // Create a Blob containing the data
  const blob = new Blob([json], { type: 'application/json' });
  
  // Create download link
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}.json`;
  
  // Trigger download
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

/**
 * Loads map data from a file
 * @returns Promise that resolves with the loaded map data
 */
export function loadMap(): Promise<MapData> {
  return new Promise((resolve, reject) => {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    // Setup file reader
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const mapData = JSON.parse(content);
          
          // Validate basic structure
          if (!mapData || 
              typeof mapData !== 'object' ||
              !('width' in mapData) || 
              !('height' in mapData) ||
              !('cells' in mapData)) {
            reject(new Error('Invalid map data format'));
            return;
          }
          
          // Check for valid dimensions
          if (typeof mapData.width !== 'number' || 
              typeof mapData.height !== 'number' ||
              mapData.width <= 0 || 
              mapData.height <= 0 ||
              mapData.width > 100 || 
              mapData.height > 100) {
            reject(new Error('Invalid map dimensions'));
            return;
          }
          
          // Validate cells
          if (typeof mapData.cells !== 'object') {
            reject(new Error('Invalid cells data'));
            return;
          }
          
          // Sanitize tiles data by validating each cell
          const sanitizedCells: Record<string, MapCell> = {};
          let hasInvalidCell = false;
          
          for (const key in mapData.cells) {
            const cell = mapData.cells[key];
            const [x, y] = key.split(',').map(Number);
            
            // Skip invalid coordinates
            if (isNaN(x) || isNaN(y) || 
                x < 0 || y < 0 || 
                x >= mapData.width || 
                y >= mapData.height) {
              hasInvalidCell = true;
              continue;
            }
            
            // Validate cell structure
            if (!cell || 
                typeof cell !== 'object' || 
                !Array.isArray(cell.tiles)) {
              hasInvalidCell = true;
              continue;
            }
            
            // Filter out non-string tile IDs
            const validTiles = cell.tiles.filter((id: unknown): id is string => typeof id === 'string');
            
            // Only include valid cells
            if (validTiles.length > 0) {
              sanitizedCells[key] = {
                x,
                y,
                tiles: validTiles
              };
            }
          }
          
          // Build sanitized map
          const sanitizedMap: MapData = {
            width: mapData.width,
            height: mapData.height,
            cells: sanitizedCells
          };
          
          if (hasInvalidCell) {
            console.warn('Some invalid cells were removed during import');
          }
          
          resolve(sanitizedMap);
        } catch (err) {
          reject(new Error('Failed to parse JSON data'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    };
    
    // Trigger file selection
    input.click();
  });
}