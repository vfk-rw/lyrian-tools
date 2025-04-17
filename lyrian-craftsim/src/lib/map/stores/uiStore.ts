import { writable, derived, get } from 'svelte/store';
import { type Writable } from 'svelte/store';
import { mapData, addRegion } from './mapStore';
import { v4 as uuidv4 } from 'uuid';

// Tool types
export type ToolType = 'select' | 'biome' | 'height' | 'poi' | 'region' | 'icon' | 'route';

// Biome types
export const BIOME_TYPES = ['plains', 'forest', 'mountain', 'water', 'desert', 'swamp', 'tundra', 'unexplored'];

// POI types
export const POI_TYPES = [
  'town', 'city', 'castle', 'dungeon', 'cave', 'temple', 
  'camp', 'ruins', 'port', 'mountain', 'forest', 'landmark', 
  'quest', 'treasure'
];

// Modal parameters interfaces
export interface POIModalParams {
  type: 'poi';
  title?: string;
  tileKey: string;
  editingPOI?: {
    id: string;
    name: string;
    icon: string;
    description?: string;
  };
}

export interface RegionModalParams {
  type: 'region';
  title?: string;
  regionId?: string;
}

export interface ResizeModalParams {
  type: 'resize';
  title?: string;
}

// Route modal parameters
export interface RouteModalParams {
  type: 'route';
  title?: string;
  routeId?: string;
  pendingWaypoint?: boolean; // Indicates route is being created for a pending waypoint
}

// Waypoint modal parameters
export interface WaypointModalParams {
  type: 'waypoint';
  title?: string;
  routeId: string;
  waypointId?: string;
  q: number;
  r: number;
}

export type ModalParams = POIModalParams | RegionModalParams | ResizeModalParams | RouteModalParams | WaypointModalParams;

// POI hover info
export interface POIHoverInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
  tileKey: string;
}

// Region hover info
export interface RegionHoverInfo {
  id: string;
  name: string;
  color: string;
  description: string;
}

// Waypoint hover info
export interface WaypointHoverInfo {
  routeId: string;
  waypointId: string;
  q: number;
  r: number;
  date?: string;
  notes?: string;
  routeName?: string;
  routeColor?: string;
  participants?: string[]; // Array of adventurer names from the route
  gm?: string; // Optional GM (player name) from the route
}

// Route hover info
export interface RouteHoverInfo {
  id: string;
  name: string;
  color: string;
  lengthInDays: number;
  participants: string[]; // Array of adventurer names
  gm?: string; // Optional GM (player name)
}

// UI State interface
export interface UIState {
  // Current tool selection
  currentTool: ToolType;
  selectedBiome: string;
  selectedHeight: number;
  selectedIcon: string | null;
  
  // Display options
  showRegionLabels: boolean;
  showPOILabels: boolean;
  showHeightLabels: boolean;
  showRouteLabels: boolean;
  
  // Modal state
  showModal: boolean;
  modalParams: ModalParams | null;
  
  // Selection and hover state
  selectedTiles: Array<{q: number, r: number}>;
  hoveredTile: {q: number, r: number} | null;
  hoveredRegion: string | null;
  hoveredPOI: POIHoverInfo | null;
  hoveredRegionInfo: RegionHoverInfo | null;
  hoveredWaypoint: WaypointHoverInfo | null;
  hoveredRoute: RouteHoverInfo | null;
  
  // Pending waypoint coordinates (used when creating a route)
  pendingWaypointQ?: number;
  pendingWaypointR?: number;
  
  // Camera control
  cameraOffset: { x: number, y: number };
  cameraZoom: number;
  // Brush size for painting tools
  brushRadius?: number;
}

// Initialize UI store with default values
const initialState: UIState = {
  currentTool: 'select',
  selectedBiome: 'plains',
  selectedHeight: 0,
  selectedIcon: null,
  
  showRegionLabels: true,
  showPOILabels: true,
  showHeightLabels: false,
  showRouteLabels: true,
  
  showModal: false,
  modalParams: null,
  
  selectedTiles: [],
  hoveredTile: null,
  hoveredRegion: null,
  hoveredPOI: null,
  hoveredRegionInfo: null,
  hoveredWaypoint: null,
  hoveredRoute: null,
  
  cameraOffset: { x: 0, y: 0 },
  cameraZoom: 1.5, // 50% more zoom for better readability
  brushRadius: 1 // Default brush size
};

// Create the store
const createUIStore = () => {
  const { subscribe, update, set } = writable<UIState>(initialState);
  
  return {
    subscribe,
    set,
    
    // Tool selection
    selectTool: (tool: ToolType) => update(state => ({ ...state, currentTool: tool })),
    selectBiome: (biome: string) => update(state => ({ ...state, selectedBiome: biome })),
    selectHeight: (height: number) => update(state => ({ ...state, selectedHeight: height })),
    selectIcon: (icon: string | null) => update(state => ({ ...state, selectedIcon: icon })),
    
    // Display options
    toggleRegionLabels: () => update(state => ({ ...state, showRegionLabels: !state.showRegionLabels })),
    togglePOILabels: () => update(state => ({ ...state, showPOILabels: !state.showPOILabels })),
    toggleHeightLabels: () => update(state => ({ ...state, showHeightLabels: !state.showHeightLabels })),
    toggleRouteLabels: () => update(state => ({ ...state, showRouteLabels: !state.showRouteLabels })),
    
    // Modal management
    showModal: (params: ModalParams) => update(state => ({ 
      ...state, 
      showModal: true, 
      modalParams: params 
    })),
    
    closeModal: () => update(state => ({ 
      ...state, 
      showModal: false, 
      modalParams: null 
    })),
    
    // Selection management
    clearSelection: () => update(state => ({ ...state, selectedTiles: [] })),
    
    toggleTileSelection: (q: number, r: number) => update(state => {
      const tileIndex = state.selectedTiles.findIndex(
        tile => tile.q === q && tile.r === r
      );
      
      let newSelectedTiles;
      
      if (tileIndex === -1) {
        // Add to selection
        newSelectedTiles = [...state.selectedTiles, { q, r }];
      } else {
        // Remove from selection
        newSelectedTiles = [
          ...state.selectedTiles.slice(0, tileIndex),
          ...state.selectedTiles.slice(tileIndex + 1)
        ];
      }
      
      return { ...state, selectedTiles: newSelectedTiles };
    }),
    
    // Camera controls
    updateCameraOffset: (x: number, y: number) => update(state => ({
      ...state,
      cameraOffset: { x, y }
    })),
    
    updateCameraZoom: (zoom: number) => update(state => ({
      ...state,
      cameraZoom: zoom
    })),
    
    // Create a region from the selected tiles
    createRegion: (name: string, color: string, description?: string) => {
      const currentState = get(uiStore);
      const tiles = currentState.selectedTiles.map(tile => [tile.q, tile.r] as [number, number]);
      
      if (tiles.length > 0) {
        // Create a new region with the selected tiles
        addRegion({
          id: uuidv4(),
          name,
          color,
          description,
          tiles
        });
        
        // Clear the selection
        update(state => ({ ...state, selectedTiles: [] }));
      }
    },
    
    // POI hover management
    setHoveredPOI: (poiInfo: POIHoverInfo | null) => update(state => ({
      ...state,
      hoveredPOI: poiInfo
    })),
    
    // Waypoint hover management
    setHoveredWaypoint: (waypointInfo: WaypointHoverInfo | null) => update(state => ({
      ...state,
      hoveredWaypoint: waypointInfo
    })),
    
    // Route hover management
    setHoveredRoute: (routeInfo: RouteHoverInfo | null) => update(state => ({
      ...state,
      hoveredRoute: routeInfo
    })),
    
    setBrushRadius: (radius: number) => update(state => ({ ...state, brushRadius: radius }))
  };
};

// Create and export the UI store
export const uiStore = createUIStore();

// Derived stores for specific UI states
export const selectedTileKeys = derived(uiStore, $uiStore => 
  $uiStore.selectedTiles.map(tile => `${tile.q},${tile.r}`)
);

export const hoveredTileKey = derived(uiStore, $uiStore => 
  $uiStore.hoveredTile ? `${$uiStore.hoveredTile.q},${$uiStore.hoveredTile.r}` : null
);

// Export specific actions for convenience
export const { 
  selectTool, 
  selectBiome, 
  selectHeight, 
  selectIcon,
  toggleRegionLabels, 
  togglePOILabels, 
  toggleHeightLabels,
  toggleRouteLabels,
  showModal, 
  closeModal,
  clearSelection,
  toggleTileSelection,
  updateCameraOffset,
  updateCameraZoom,
  createRegion,
  setHoveredPOI,
  setHoveredWaypoint,
  setHoveredRoute,
  setBrushRadius
} = uiStore;
