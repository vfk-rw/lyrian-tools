import { writable } from 'svelte/store';

// Store for the horizontal tile size (in pixels)
export const tileSize = writable(256);

// Store for the vertical tile spacing (in pixels)
// The optimal value for these hex tiles is exactly 2/3 of the horizontal size (171px)
export const verticalTileSize = writable(171);