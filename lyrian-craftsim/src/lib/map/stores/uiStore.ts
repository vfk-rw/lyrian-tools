import { writable, derived, get } from 'svelte/store';
import { type Writable } from 'svelte/store';
import { mapData, addRegion } from './mapStore';
import { v4 as uuidv4 } from 'uuid';

// Tool types
export type ToolType = 'select' | 'biome' | 'height' | 'poi' | 'region' | 'resize';

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

export type ModalParams = POIModalParams | RegionModalParams;

// UI State interface
export interface UIState {
  // Current tool selection
  currentTool: ToolType;
  selectedBiome: string;
  selectedHeight: number;
  
  // Display options
  showLabels: boolean;
  showGrid: boolean;
  
  // Modal state
  showModal: boolean;
  modalParams: ModalParams | null;
  
  // Selection and hover state
  selectedTiles: Array<{q: number, r: number}>;
  hoveredTile: {q: number, r: number} | null;
  hoveredRegion: string | null;
  
  // Camera control
  cameraOffset: { x: number, y: number };
  cameraZoom: number;
}

// Initialize UI store with default values
const initialState: UIState = {
  currentTool: 'select',
  selectedBiome: 'plains',
  selectedHeight: 0,
  
  showLabels: true,
  showGrid: true,
  
  showModal: false,
  modalParams: null,
  
  selectedTiles: [],
  hoveredTile: null,
  hoveredRegion: null,
  
  cameraOffset: { x: 0, y: 0 },
  cameraZoom: 1
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
    
    // Display options
    toggleLabels: () => update(state => ({ ...state, showLabels: !state.showLabels })),
    toggleGrid: () => update(state => ({ ...state, showGrid: !state.showGrid })),
    
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
    createRegion: (name: string, color: string) => {
      const currentState = get(uiStore);
      const tiles = currentState.selectedTiles.map(tile => [tile.q, tile.r] as [number, number]);
      
      if (tiles.length > 0) {
        // Create a new region with the selected tiles
        addRegion({
          id: uuidv4(),
          name,
          color,
          tiles
        });
        
        // Clear the selection
        update(state => ({ ...state, selectedTiles: [] }));
      }
    }
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
  toggleLabels, 
  toggleGrid, 
  showModal, 
  closeModal,
  clearSelection,
  toggleTileSelection,
  updateCameraOffset,
  updateCameraZoom,
  createRegion
} = uiStore;
