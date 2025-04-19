import { writable } from 'svelte/store';

// Available tools/modes for the editor
export enum EditMode {
  SELECT = 'select',
  PAINT = 'paint',
  ERASE = 'erase',
  REGION = 'region',
  POI = 'poi',
}

// Interface for the UI state
interface UIState {
  // Current editing mode
  mode: EditMode;
  
  // Current selected asset ID for painting
  selectedAssetId: string | null;
  
  // UI controls
  showGrid: boolean;
  showRegions: boolean;
  showPOIs: boolean;
  
  // Hex display options
  hexProjectionAngle: number; // Continuous value from 0-60
  
  // Canvas transform state
  zoom: number;
  panX: number;
  panY: number;
  
  // Flag for whether import/export modal is open
  isImportExportModalOpen: boolean;
  
  // Flag for whether new map modal is open
  isNewMapModalOpen: boolean;
  
  // Flag for whether region edit modal is open
  isRegionEditModalOpen: boolean;
  
  // Flag for whether POI edit modal is open
  isPOIEditModalOpen: boolean;
}

// Create the initial state
const initialState: UIState = {
  mode: EditMode.SELECT,
  selectedAssetId: null,
  showGrid: true,
  showRegions: true,
  showPOIs: true,
  hexProjectionAngle: 45, // Default to 45 degrees
  zoom: 1,
  panX: 0,
  panY: 0,
  isImportExportModalOpen: false,
  isNewMapModalOpen: false,
  isRegionEditModalOpen: false,
  isPOIEditModalOpen: false,
};

// Create the store
function createUIStore() {
  const { subscribe, set, update } = writable<UIState>(initialState);
  
  return {
    subscribe,
    
    // Set the edit mode
    setMode: (mode: EditMode) => update(state => ({ ...state, mode })),
    
    // Set the selected asset ID
    setSelectedAsset: (assetId: string | null) => update(state => ({ ...state, selectedAssetId: assetId })),
    
    // Toggle grid visibility
    toggleGrid: () => update(state => ({ ...state, showGrid: !state.showGrid })),
    
    // Toggle region visibility
    toggleRegions: () => update(state => ({ ...state, showRegions: !state.showRegions })),
    
    // Toggle POI visibility
    togglePOIs: () => update(state => ({ ...state, showPOIs: !state.showPOIs })),
    
    // Set hex projection angle (0-60 degrees)
    setHexProjectionAngle: (angle: number) => update(state => ({
      ...state,
      hexProjectionAngle: Math.min(60, Math.max(0, angle))
    })),
    
    // Set zoom level
    setZoom: (zoom: number) => update(state => ({ ...state, zoom: Math.max(0.1, Math.min(3, zoom)) })),
    
    // Set pan position
    setPan: (panX: number, panY: number) => update(state => ({ ...state, panX, panY })),
    
    // Reset view transform
    resetView: () => update(state => ({ ...state, zoom: 1, panX: 0, panY: 0 })),
    
    // Toggle import/export modal
    toggleImportExportModal: () => update(state => ({ 
      ...state, 
      isImportExportModalOpen: !state.isImportExportModalOpen 
    })),
    
    // Toggle new map modal
    toggleNewMapModal: () => update(state => ({ 
      ...state, 
      isNewMapModalOpen: !state.isNewMapModalOpen 
    })),
    
    // Toggle region edit modal
    toggleRegionEditModal: () => update(state => ({ 
      ...state, 
      isRegionEditModalOpen: !state.isRegionEditModalOpen 
    })),
    
    // Toggle POI edit modal
    togglePOIEditModal: () => update(state => ({ 
      ...state, 
      isPOIEditModalOpen: !state.isPOIEditModalOpen 
    })),
  };
}

// Create and export the store
export const uiStore = createUIStore();