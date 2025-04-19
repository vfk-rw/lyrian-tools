import { writable } from 'svelte/store';

// Store for the tile size (in pixels)
export const tileSize = writable(256);

// Store for the vertical tile spacing (in pixels)
export const verticalTileSize = writable(256);