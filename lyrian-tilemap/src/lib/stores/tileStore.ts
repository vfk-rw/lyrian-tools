import { writable } from 'svelte/store';
import type { TileInfo, TileCategory } from '$lib/types';

// Store for all available tile categories
export const tileCategories = writable<TileCategory[]>([]);

// Store for the currently selected tile
export const selectedTile = writable<TileInfo | null>(null);

// Function to select a tile
export function selectTile(tile: TileInfo) {
  selectedTile.set(tile);
}

// Function to initialize the store with data from server
export function initializeTileStore(categories: TileCategory[]) {
  tileCategories.set(categories);
}