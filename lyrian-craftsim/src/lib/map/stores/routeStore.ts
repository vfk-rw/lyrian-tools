import { writable, derived, get } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';

// Route and Waypoint interfaces
export interface Waypoint {
  id: string;
  q: number;
  r: number;
  date?: string;  // ISO date string (YYYY-MM-DD)
  notes?: string;
}

export interface Route {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  editable: boolean;
  waypoints: Waypoint[];
}

// State interface
export interface RoutesState {
  routes: Map<string, Route>;
}

// Initialize store with default values
const initialState: RoutesState = {
  routes: new Map()
};

// Create the store
function createRoutesStore() {
  const { subscribe, update, set } = writable<RoutesState>(initialState);
  
  return {
    subscribe,
    
    // Add a new route
    addRoute: (routeData: Omit<Route, 'id' | 'visible' | 'editable' | 'waypoints'>) => {
      const id = uuidv4();
      
      update(state => {
        const routes = new Map(state.routes);
        
        routes.set(id, {
          id,
          name: routeData.name,
          color: routeData.color,
          visible: true,
          editable: false,
          waypoints: []
        });
        
        return { routes };
      });
      
      return id;
    },
    
    // Update a route
    updateRoute: (routeId: string, routeData: Partial<Omit<Route, 'id' | 'waypoints'>>) => {
      update(state => {
        const routes = new Map(state.routes);
        const route = routes.get(routeId);
        
        if (route) {
          routes.set(routeId, {
            ...route,
            ...routeData
          });
        }
        
        return { routes };
      });
    },
    
    // Remove a route
    removeRoute: (routeId: string) => {
      update(state => {
        const routes = new Map(state.routes);
        routes.delete(routeId);
        return { routes };
      });
    },
    
    // Add a waypoint to a route
    addWaypoint: (routeId: string, waypointData: Omit<Waypoint, 'id'>) => {
      const id = uuidv4();
      
      update(state => {
        const routes = new Map(state.routes);
        const route = routes.get(routeId);
        
        if (route) {
          const waypoints = [...route.waypoints, { id, ...waypointData }];
          
          routes.set(routeId, {
            ...route,
            waypoints
          });
        }
        
        return { routes };
      });
      
      return id;
    },
    
    // Update a waypoint
    updateWaypoint: (routeId: string, waypointId: string, waypointData: Partial<Omit<Waypoint, 'id' | 'q' | 'r'>>) => {
      update(state => {
        const routes = new Map(state.routes);
        const route = routes.get(routeId);
        
        if (route) {
          const waypointIndex = route.waypoints.findIndex(wp => wp.id === waypointId);
          
          if (waypointIndex !== -1) {
            const waypoints = [...route.waypoints];
            waypoints[waypointIndex] = {
              ...waypoints[waypointIndex],
              ...waypointData
            };
            
            routes.set(routeId, {
              ...route,
              waypoints
            });
          }
        }
        
        return { routes };
      });
    },
    
    // Remove a waypoint
    removeWaypoint: (routeId: string, waypointId: string) => {
      update(state => {
        const routes = new Map(state.routes);
        const route = routes.get(routeId);
        
        if (route) {
          const waypoints = route.waypoints.filter(wp => wp.id !== waypointId);
          
          routes.set(routeId, {
            ...route,
            waypoints
          });
        }
        
        return { routes };
      });
    },
    
    // Toggle a route's visibility
    toggleRouteVisibility: (routeId: string) => {
      update(state => {
        const routes = new Map(state.routes);
        const route = routes.get(routeId);
        
        if (route) {
          routes.set(routeId, {
            ...route,
            visible: !route.visible
          });
        }
        
        return { routes };
      });
    },
    
    // Toggle edit mode for a route
    toggleRouteEditMode: (routeId: string) => {
      const currentState = get(routesData);
      const route = currentState.routes.get(routeId);
      
      if (route) {
        // First turn off any other edit modes
        update(state => {
          const routes = new Map(state.routes);
          
          // Turn off edit mode for all routes
          for (const [id, r] of routes.entries()) {
            if (r.editable) {
              routes.set(id, {
                ...r,
                editable: false
              });
            }
          }
          
          // Now toggle the selected route
          routes.set(routeId, {
            ...route,
            editable: !route.editable
          });
          
          return { routes };
        });
      }
    },
    
    // Exit all edit modes
    exitAllEditModes: () => {
      update(state => {
        const routes = new Map(state.routes);
        
        // Turn off edit mode for all routes
        for (const [id, r] of routes.entries()) {
          if (r.editable) {
            routes.set(id, {
              ...r,
              editable: false
            });
          }
        }
        
        return { routes };
      });
    },
    
    // Export routes to JSON
    exportRoutesJSON: () => {
      const state = get(routesData);
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        routes: Array.from(state.routes.values()).map(route => ({
          id: route.id,
          name: route.name,
          color: route.color,
          visible: route.visible,
          waypoints: route.waypoints.map(wp => {
            // Create a base waypoint object with required fields
            const waypointData: any = {
              id: wp.id,
              q: wp.q,
              r: wp.r
            };
            
            // Only include optional fields if they exist
            if (wp.date !== undefined) {
              waypointData.date = wp.date;
            }
            
            if (wp.notes !== undefined) {
              waypointData.notes = wp.notes;
            }
            
            return waypointData;
          })
        }))
      };
      
      return exportData;
    },
    
    // Import routes from JSON with security validation
    importRoutesJSON: (jsonData: any, fileSize: number = 0) => {
      try {
        // Import validateAndSanitizeRoutesJSON dynamically to prevent circular dependencies
        import('../utils/secureRouteImport').then(({ validateAndSanitizeRoutesJSON }) => {
          // Validate and sanitize the routes JSON
          const validationResult = validateAndSanitizeRoutesJSON(jsonData, fileSize);
          
          if (!validationResult.isValid || !validationResult.sanitizedData) {
            console.error('Failed to import routes:', validationResult.error);
            return false;
          }
          
          // Convert the sanitized array to a Map
          const routesMap = new Map<string, Route>();
          for (const route of validationResult.sanitizedData) {
            routesMap.set(route.id, route);
          }
          
          // Update the store
          set({ routes: routesMap });
          return true;
        });
        
        return true; // Return true initially, actual validation happens asynchronously
      } catch (error) {
        console.error('Error importing routes:', error);
        return false;
      }
    },
    
    // Get the route length in days
    getRouteLengthInDays: (routeId: string): number => {
      const state = get(routesData);
      const route = state.routes.get(routeId);
      
      if (!route || route.waypoints.length < 2) {
        return 0;
      }
      
      const waypointsWithDates = route.waypoints.filter(wp => wp.date);
      
      if (waypointsWithDates.length < 2) {
        return 0;
      }
      
      // Sort waypoints by date
      const sortedWaypoints = [...waypointsWithDates].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      });
      
      // Calculate the difference in days between first and last waypoint
      const firstDate = new Date(sortedWaypoints[0].date!);
      const lastDate = new Date(sortedWaypoints[sortedWaypoints.length - 1].date!);
      
      const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    }
  };
}

// Create and export the routesData store
export const routesData = createRoutesStore();

// Derived store to get the currently active route in edit mode
export const activeEditRoute = derived(routesData, $routesData => {
  for (const route of $routesData.routes.values()) {
    if (route.editable) {
      return route;
    }
  }
  return null;
});

// Export specific actions for convenience
export const {
  addRoute,
  updateRoute,
  removeRoute,
  addWaypoint,
  updateWaypoint,
  removeWaypoint,
  toggleRouteVisibility,
  toggleRouteEditMode,
  exitAllEditModes,
  exportRoutesJSON,
  importRoutesJSON,
  getRouteLengthInDays
} = routesData;
