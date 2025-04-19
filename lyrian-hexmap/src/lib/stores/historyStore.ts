import { writable } from 'svelte/store';
import type { MapData } from '$lib/hexUtils/yamlIO';
import { mapStore, exportableMapData } from './mapStore';
import { get } from 'svelte/store';

// Maximum number of history states to keep
const MAX_HISTORY_LENGTH = 50;

// Interface for a history entry
interface HistoryEntry {
  timestamp: number;
  mapData: MapData;
  description: string;
}

// Interface for the history store state
interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  isSaving: boolean;
  lastSavedState: MapData | null;
}

// Create the initial state
const initialState: HistoryState = {
  past: [],
  future: [],
  isSaving: false,
  lastSavedState: null
};

// Function to check if two MapData objects are equal
const areEqual = (a: MapData, b: MapData): boolean => {
  return JSON.stringify(a) === JSON.stringify(b);
};

// Create the store
function createHistoryStore() {
  const { subscribe, set, update } = writable<HistoryState>(initialState);
  
  return {
    subscribe,
    
    // Push a new state to history
    pushState: (description: string) => update(state => {
      // If we're already in the process of saving (to avoid recursion when restoring)
      if (state.isSaving) {
        return state;
      }
      
      const currentMapData = get(exportableMapData);
      
      // Check if the current state is already at the top of history to avoid duplicates
      if (state.past.length > 0 && areEqual(state.past[state.past.length - 1].mapData, currentMapData)) {
        return state;
      }
      
      // Create the new history entry
      const newEntry: HistoryEntry = {
        timestamp: Date.now(),
        mapData: currentMapData,
        description
      };
      
      // Add to past, clear future (since we're creating a new branch)
      const newPast = [...state.past, newEntry].slice(-MAX_HISTORY_LENGTH);
      
      return {
        ...state,
        past: newPast,
        future: []
      };
    }),
    
    // Undo the last action
    undo: () => update(state => {
      // Nothing to undo
      if (state.past.length <= 1) {
        return state;
      }
      
      // Move current state to future
      const currentMapData = get(exportableMapData);
      const newFuture = [
        {
          timestamp: Date.now(),
          mapData: currentMapData,
          description: 'Before undo'
        },
        ...state.future
      ].slice(0, MAX_HISTORY_LENGTH);
      
      // Get previous state
      const newPast = [...state.past];
      const previousEntry = newPast.pop();
      
      if (!previousEntry) return state;
      
      // Apply the previous state
      state.isSaving = true;
      mapStore.importMapData(previousEntry.mapData);
      state.isSaving = false;
      
      return {
        ...state,
        past: newPast,
        future: newFuture,
        isSaving: false
      };
    }),
    
    // Redo the last undone action
    redo: () => update(state => {
      // Nothing to redo
      if (state.future.length === 0) {
        return state;
      }
      
      // Get the next state
      const [nextEntry, ...remainingFuture] = state.future;
      
      // Apply the next state
      state.isSaving = true;
      mapStore.importMapData(nextEntry.mapData);
      state.isSaving = false;
      
      return {
        ...state,
        past: [...state.past, nextEntry],
        future: remainingFuture,
        isSaving: false
      };
    }),
    
    // Clear history
    clear: () => set(initialState),
    
    // Mark the current state as saved
    markSaved: () => update(state => {
      const currentMapData = get(exportableMapData);
      return {
        ...state,
        lastSavedState: currentMapData
      };
    }),
    
    // Check if there are unsaved changes
    hasUnsavedChanges: () => {
      const state = get({ subscribe });
      const currentMapData = get(exportableMapData);
      return state.lastSavedState ? !areEqual(state.lastSavedState, currentMapData) : true;
    }
  };
}

// Create and export the store
export const historyStore = createHistoryStore();