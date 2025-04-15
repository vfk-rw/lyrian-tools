/**
 * Census data parser for player and adventurer names
 * Reads and parses data from the CSV file
 */

import { browser } from '$app/environment';

export interface CensusEntry {
  playerName: string;
  adventurerName: string;
  spiritCore: number;
  race: string;
  subRace: string;
  tier1Class: string[];
  tier2Class: string[];
  tier3Class: string[];
}

// Array to store the parsed census data
let censusCache: CensusEntry[] | null = null;

/**
 * Parse a CSV string into an array of census entries
 */
function parseCSVString(csvString: string): CensusEntry[] {
  // Split the CSV into lines
  const lines = csvString.split('\n').filter(line => line.trim().length > 0);
  
  // The first line is headers, so start from index 1
  const dataLines = lines.slice(1);
  
  return dataLines.map(line => {
    // Split the line by commas, but handle quoted values properly
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    // Don't forget to add the last part
    parts.push(current);
    
    // Extract values from the parts array
    const [
      playerName,
      adventurerName,
      spiritCoreStr,
      race,
      subRace,
      tier1ClassStr,
      tier2ClassStr,
      tier3ClassStr
    ] = parts;
    
    // Parse the spirit core as a number
    const spiritCore = parseInt(spiritCoreStr) || 0;
    
    // Parse class strings into arrays, handling empty strings and multiple classes
    const tier1Class = tier1ClassStr ? parseClassString(tier1ClassStr) : [];
    const tier2Class = tier2ClassStr ? parseClassString(tier2ClassStr) : [];
    const tier3Class = tier3ClassStr ? parseClassString(tier3ClassStr) : [];
    
    return {
      playerName,
      adventurerName,
      spiritCore,
      race,
      subRace,
      tier1Class,
      tier2Class,
      tier3Class
    };
  });
}

/**
 * Parse a class string that may contain multiple classes
 */
function parseClassString(classStr: string): string[] {
  // Replace quotes with empty strings and split by comma
  return classStr
    .replace(/"/g, '')
    .split(',')
    .map(c => c.trim())
    .filter(c => c.length > 0);
}

/**
 * Load the census data from the CSV file
 */
export async function loadCensusData(): Promise<CensusEntry[]> {
  // Return the cached data if available
  if (censusCache) {
    return censusCache;
  }
  
  // Only run in browser environment
  if (!browser) {
    return [];
  }
  
  try {
    // Fetch the CSV file from static directory
    const response = await fetch('/data/census.csv');
    
    if (!response.ok) {
      console.error('Failed to load census data:', response.statusText);
      return [];
    }
    
    const csvText = await response.text();
    censusCache = parseCSVString(csvText);
    return censusCache;
  } catch (error) {
    console.error('Error loading census data:', error);
    return [];
  }
}

/**
 * Get the list of player names
 */
export async function getPlayerNames(): Promise<string[]> {
  const censusData = await loadCensusData();
  return [...new Set(censusData.map(entry => entry.playerName))].sort();
}

/**
 * Get the list of adventurer names
 */
export async function getAdventurerNames(): Promise<string[]> {
  const censusData = await loadCensusData();
  return [...new Set(censusData.map(entry => entry.adventurerName))].sort();
}

/**
 * Get a player name from an adventurer name
 */
export async function getPlayerNameFromAdventurer(adventurerName: string): Promise<string | null> {
  const censusData = await loadCensusData();
  const entry = censusData.find(entry => entry.adventurerName === adventurerName);
  return entry ? entry.playerName : null;
}

/**
 * Get adventurer names for a player
 */
export async function getAdventurerNamesForPlayer(playerName: string): Promise<string[]> {
  const censusData = await loadCensusData();
  return censusData
    .filter(entry => entry.playerName === playerName)
    .map(entry => entry.adventurerName);
}
