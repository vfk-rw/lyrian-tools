import type { POI, Tile, Region } from '../stores/mapStore';

/**
 * Constants for validation limits
 */
export const VALIDATION_LIMITS = {
  // General limits
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  
  // Text field limits
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 2000,
  
  // Value ranges
  MIN_COORDINATE: -1000,
  MAX_COORDINATE: 1000,
  MIN_HEIGHT: -10,
  MAX_HEIGHT: 10,
  
  // Allowed biome types
  ALLOWED_BIOMES: [
    'unexplored', 'plains', 'forest', 'desert', 
    'mountain', 'water', 'tundra', 'swamp', 
    'jungle', 'taiga', 'savanna', 'volcano'
  ],
  
  // Icon registry
  VALID_ICON_CATEGORIES: [
    'animal', 'building', 'civilization', 'nature'
  ]
};

/**
 * Validates if a file is within the size limit
 */
export function validateFileSize(size: number): boolean {
  return size <= VALIDATION_LIMITS.MAX_FILE_SIZE_BYTES;
}

/**
 * Checks if a string contains only ASCII or safe Unicode characters
 */
export function isSafeString(str: string): boolean {
  // Allow letters, numbers, basic punctuation, and common symbols
  // Reject control characters, unusual Unicode, potential XSS characters, etc.
  const safeRegex = /^[\p{L}\p{N}\p{P}\p{Z}\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Modifier_Base} ,.;:'"!@#$%^&*()[\]{}_+=<>?/-]*$/u;
  return safeRegex.test(str);
}

/**
 * Sanitize a string by removing unsafe characters
 */
export function sanitizeString(str: string, maxLength: number): string {
  if (!str) return '';
  
  // Trim and limit length
  const trimmed = str.slice(0, maxLength);
  
  // Replace unsafe characters with spaces
  return trimmed.replace(/[^\p{L}\p{N}\p{P}\p{Z}\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Modifier_Base} ,.;:'"!@#$%^&*()[\]{}_+=<>?/-]/gu, ' ');
}

/**
 * Validates and sanitizes a name string
 */
export function validateName(name: string | undefined): string {
  if (!name) return 'Unnamed';
  return sanitizeString(name, VALIDATION_LIMITS.MAX_NAME_LENGTH);
}

/**
 * Validates and sanitizes a description string
 */
export function validateDescription(description: string | undefined): string {
  if (!description) return '';
  return sanitizeString(description, VALIDATION_LIMITS.MAX_DESCRIPTION_LENGTH);
}

/**
 * Validates a number is within range and defaults if not
 */
export function validateNumberInRange(
  value: number | undefined, 
  min: number, 
  max: number, 
  defaultValue: number
): number {
  if (value === undefined || isNaN(value) || value < min || value > max) {
    return defaultValue;
  }
  return value;
}

/**
 * Validates a coordinate value
 */
export function validateCoordinate(value: number | undefined): number {
  return validateNumberInRange(
    value,
    VALIDATION_LIMITS.MIN_COORDINATE,
    VALIDATION_LIMITS.MAX_COORDINATE,
    0
  );
}

/**
 * Validates a height value
 */
export function validateHeight(value: number | undefined): number {
  return validateNumberInRange(
    value,
    VALIDATION_LIMITS.MIN_HEIGHT,
    VALIDATION_LIMITS.MAX_HEIGHT,
    0
  );
}

/**
 * Validates a biome type
 */
export function validateBiome(biome: string | undefined): string {
  if (!biome || !VALIDATION_LIMITS.ALLOWED_BIOMES.includes(biome)) {
    return 'unexplored';
  }
  return biome;
}

/**
 * Validates and sanitizes an icon path
 * Using a strict registry approach to prevent path traversal
 */
export function validateIconPath(iconPath: string | null | undefined): string | null {
  if (!iconPath) return null;
  
  // Very strict path format validation with regex
  // Format must be exactly: /icons/category/filename.svg
  // where:
  // - category must be one of the valid categories
  // - filename can only contain alphanumeric chars, hyphens and underscores
  // - the only period allowed is the one before "svg"
  const validPathRegex = new RegExp(
    `^/icons/(${VALIDATION_LIMITS.VALID_ICON_CATEGORIES.join('|')})/([a-zA-Z0-9_-]+)\.svg$`
  );
  
  if (!validPathRegex.test(iconPath)) {
    return null;
  }
  
  // Validate path depth (should be exactly 3 levels: /icons/category/file.svg)
  const parts = iconPath.split('/');
  if (parts.length !== 4) { // [empty string, "icons", category, filename.svg]
    return null;
  }
  
  // Additional checks for security
  
  // Check for any directory traversal attempts
  if (iconPath.includes('..') || iconPath.includes('./') || iconPath.includes('/.')) {
    return null;
  }
  
  // Check for wrong slash types (backslashes not allowed)
  if (iconPath.includes('\\')) {
    return null;
  }
  
  // Check that we only have one period and it's right before "svg"
  const periodCount = (iconPath.match(/\./g) || []).length;
  if (periodCount !== 1 || !iconPath.endsWith('.svg')) {
    return null;
  }
  
  // Ensure filename isn't too long to prevent buffer overflow attacks
  const filename = parts[3];
  if (filename.length > 50) { // 50 chars should be plenty for a filename
    return null;
  }
  
  // Return the validated path - it's already "clean" due to strict regex
  return iconPath;
}

/**
 * Validates a single POI object
 */
export function validatePOI(poi: any): POI | null {
  if (!poi || typeof poi !== 'object') return null;
  
  // Basic structure validation
  if (!poi.id || typeof poi.id !== 'string') return null;
  
  return {
    id: poi.id,
    name: validateName(poi.name),
    icon: sanitizeString(poi.icon || '', VALIDATION_LIMITS.MAX_NAME_LENGTH),
    description: validateDescription(poi.description)
  };
}

/**
 * Validates a Tile object
 */
export function validateTile(tile: any): Tile | null {
  if (!tile || typeof tile !== 'object') return null;
  
  // Validate coordinates - required fields
  if (typeof tile.q !== 'number' || typeof tile.r !== 'number') return null;
  
  // Create a valid tile
  const validTile: Tile = {
    q: validateCoordinate(tile.q),
    r: validateCoordinate(tile.r),
    biome: validateBiome(tile.biome),
    height: validateHeight(tile.height),
    icon: validateIconPath(tile.icon),
    pois: []
  };
  
  // Validate POIs if they exist
  if (Array.isArray(tile.pois)) {
    validTile.pois = tile.pois
      .map((poi: any) => validatePOI(poi))
      .filter((poi: POI | null) => poi !== null) as POI[];
  }
  
  return validTile;
}

/**
 * Validates a Region object
 */
export function validateRegion(region: any): Region | null {
  if (!region || typeof region !== 'object') return null;
  
  // Basic structure validation
  if (!region.id || typeof region.id !== 'string') return null;
  if (!region.name || typeof region.name !== 'string') return null;
  if (!region.color || typeof region.color !== 'string') return null;
  
  // Validate color format (#XXX or #XXXXXX)
  const validColorRegex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
  const color = validColorRegex.test(region.color) ? region.color : '#ff0000';
  
  // Validate tiles are arrays of coordinates
  const validTiles: Array<[number, number]> = [];
  if (Array.isArray(region.tiles)) {
    for (const tileCoord of region.tiles) {
      if (Array.isArray(tileCoord) && tileCoord.length === 2) {
        const q = validateCoordinate(tileCoord[0]);
        const r = validateCoordinate(tileCoord[1]);
        validTiles.push([q, r]);
      }
    }
  }
  
  return {
    id: region.id,
    name: validateName(region.name),
    color: color,
    description: validateDescription(region.description),
    tiles: validTiles
  };
}

/**
 * Main function to validate and sanitize the entire map JSON
 */
export function validateAndSanitizeMapJSON(
  jsonData: any, 
  fileSize: number
): { isValid: boolean; sanitizedData?: any; error?: string } {
  // Check file size
  if (!validateFileSize(fileSize)) {
    return { isValid: false, error: 'File exceeds maximum size limit of 10MB' };
  }
  
  // Basic structure check
  if (!jsonData || typeof jsonData !== 'object') {
    return { isValid: false, error: 'Invalid JSON structure' };
  }
  
  // Validate required top-level fields
  if (!Array.isArray(jsonData.tiles)) {
    return { isValid: false, error: 'Missing or invalid tiles array' };
  }
  
  // Sanitize and validate data
  const sanitizedData: {
    mapName: string;
    tiles: Tile[];
    regions: Region[];
  } = {
    mapName: validateName(jsonData.mapName) || 'Imported Map',
    tiles: [],
    regions: []
  };
  
  // Validate tiles
  for (const tile of jsonData.tiles) {
    const validTile = validateTile(tile);
    if (validTile) {
      sanitizedData.tiles.push(validTile);
    }
  }
  
  // Validate regions if present
  if (Array.isArray(jsonData.regions)) {
    for (const region of jsonData.regions) {
      const validRegion = validateRegion(region);
      if (validRegion) {
        sanitizedData.regions.push(validRegion);
      }
    }
  }
  
  // Ensure we have at least one valid tile
  if (sanitizedData.tiles.length === 0) {
    return { isValid: false, error: 'No valid tiles found in the map data' };
  }
  
  return { isValid: true, sanitizedData };
}
