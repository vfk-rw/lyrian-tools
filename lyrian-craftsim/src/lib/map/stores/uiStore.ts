// Using Svelte store for state management
import { writable, get } from 'svelte/store';

// Define our UI state
export interface UIState {
  currentTool: 'biome' | 'poi' | 'region' | 'resize' | null;
  selectedBiome: string;
  selectedPoi: string;
  hoveredTile: string | null;
  selectedTile: string | null;
  selectedRegion: string | null;
  showPoiModal: boolean;
  showRegionModal: boolean;
  editingPoi: string | null;
  editingRegion: string | null;
  selectedHex: any | null; // Will be a hex object when selected
  isDrawingRegion: boolean;
  selectedTiles: Set<string>; // Set of tile keys for region selection
}

// Initialize the UI state
export const uiState = writable<UIState>({
  currentTool: null,
  selectedBiome: 'plains',
  selectedPoi: 'city',
  hoveredTile: null,
  selectedTile: null,
  selectedRegion: null,
  showPoiModal: false,
  showRegionModal: false,
  editingPoi: null,
  editingRegion: null,
  selectedHex: null,
  isDrawingRegion: false,
  selectedTiles: new Set()
});

// Helper functions to manipulate UI state
export function setTool(tool: UIState['currentTool']) {
  uiState.update(state => {
    // Clear selection if changing tools
    if (state.currentTool !== tool) {
      state.selectedTiles = new Set();
      state.isDrawingRegion = false;
    }
    return { ...state, currentTool: tool };
  });
}

export function toggleTileSelection(tileKey: string) {
  uiState.update(state => {
    const newSelectedTiles = new Set(state.selectedTiles);
    if (newSelectedTiles.has(tileKey)) {
      newSelectedTiles.delete(tileKey);
    } else {
      newSelectedTiles.add(tileKey);
    }
    return { ...state, selectedTiles: newSelectedTiles };
  });
}

export function clearSelection() {
  uiState.update(state => ({
    ...state,
    selectedTiles: new Set(),
    selectedTile: null,
    selectedHex: null
  }));
}

export function showPoiModal(tileKey: string | null = null, hex: any = null, poiId: string | null = null) {
  uiState.update(state => ({
    ...state,
    selectedTile: tileKey,
    selectedHex: hex,
    editingPoi: poiId,
    showPoiModal: true
  }));
}

export function closePoiModal() {
  uiState.update(state => ({
    ...state,
    showPoiModal: false,
    editingPoi: null,
    // Don't clear the selectedTile here to maintain context
  }));
}

export function showRegionModal(regionId: string | null = null) {
  uiState.update(state => ({
    ...state,
    editingRegion: regionId,
    showRegionModal: true
  }));
}

export function closeRegionModal() {
  uiState.update(state => ({
    ...state,
    showRegionModal: false,
    editingRegion: null,
    // We keep the selected tiles to maintain context after modal closes
  }));
}

export function selectBiome(biome: string) {
  uiState.update(state => ({
    ...state,
    selectedBiome: biome
  }));
}

export function selectPoi(poi: string) {
  uiState.update(state => ({
    ...state,
    selectedPoi: poi
  }));
}

export function startRegionDrawing() {
  clearSelection();
  uiState.update(state => ({
    ...state,
    isDrawingRegion: true
  }));
}

export function stopRegionDrawing() {
  uiState.update(state => ({
    ...state,
    isDrawingRegion: false
  }));
}
