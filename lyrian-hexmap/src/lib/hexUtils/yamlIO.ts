import yaml from 'js-yaml';
import { 
  createHex, 
  gridToJSON, 
  gridFromJSON, 
  createGrid, 
  type HexType 
} from './hexUtils';
import type { Grid } from 'honeycomb-grid';

// Interface for tile data
export interface TileData {
  q: number;
  r: number;
  assetId: string;
}

// Interface for region data
export interface RegionData {
  id: string;
  name: string;
  description: string;
  hexes: { q: number; r: number }[];
}

// Interface for POI data
export interface POIData {
  id: string;
  name: string;
  description: string;
  q: number;
  r: number;
  icon?: string;
}

// Interface for the full map data
export interface MapData {
  name: string;
  width: number;
  height: number;
  tiles: TileData[];
  regions: RegionData[];
  pois: POIData[];
}

// Function to export map data to YAML
export function exportToYAML(mapData: MapData): string {
  try {
    return yaml.dump(mapData, {
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });
  } catch (error) {
    console.error('Error exporting to YAML:', error);
    throw new Error('Failed to export map data to YAML');
  }
}

// Function to import map data from YAML
export function importFromYAML(yamlString: string): MapData {
  try {
    const data = yaml.load(yamlString) as MapData;
    
    // Validate required fields
    if (!data.name || !data.width || !data.height) {
      throw new Error('Invalid map data: missing required fields');
    }
    
    // Ensure tiles, regions, and pois arrays exist
    data.tiles = data.tiles || [];
    data.regions = data.regions || [];
    data.pois = data.pois || [];
    
    return data;
  } catch (error) {
    console.error('Error importing from YAML:', error);
    throw new Error('Failed to import map data from YAML');
  }
}

// Function to save map data to localStorage
export function saveToLocalStorage(key: string, mapData: MapData): void {
  try {
    localStorage.setItem(key, JSON.stringify(mapData));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    throw new Error('Failed to save map data to localStorage');
  }
}

// Function to load map data from localStorage
export function loadFromLocalStorage(key: string): MapData | null {
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as MapData;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    throw new Error('Failed to load map data from localStorage');
  }
}

// Export a grid to YAML-friendly object
export function hexGridToYAML(grid: Grid<HexType>): any {
  return gridToJSON(grid);
}

// Import a grid from YAML-parsed object
export function hexGridFromYAML(yamlData: any): Grid<HexType> {
  return gridFromJSON(yamlData);
}

// Convert hex grid data for saving to file
export function serializeGrid(grid: Grid<HexType>): string {
  return JSON.stringify(gridToJSON(grid));
}

// Create hex grid from saved file data
export function deserializeGrid(data: string): Grid<HexType> {
  return gridFromJSON(JSON.parse(data));
}