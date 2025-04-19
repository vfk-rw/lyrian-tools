export interface TileInfo {
	id: string;
	path: string;
	category: string;
	name: string;
}

export interface TileCategory {
	name: string;
	tiles: TileInfo[];
}

export interface MapCell {
	x: number;
	y: number;
	tiles: string[]; // Array of tile IDs (allowing multiple tiles per cell)
}

export interface MapData {
	width: number;
	height: number;
	cells: Record<string, MapCell>; // Key is "x,y"
}