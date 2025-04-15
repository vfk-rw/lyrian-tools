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
      
      console.group(`[DEBUG] routeStore.addWaypoint`);
      console.log(`Route ID: ${routeId}`);
      console.log(`Waypoint data:`, JSON.stringify(waypointData, null, 2));
      console.log(`Generated ID: ${id}`);
      
      // Make sure date is properly handled
      if ('date' in waypointData) {
        console.log(`Date provided: ${waypointData.date || 'empty string or undefined'}`);
        
        // Make a copy of the waypoint data to ensure we don't lose the date
        const processedData = { ...waypointData };
        if (processedData.date === '') {
          processedData.date = undefined;
          console.log(`Date converted from empty string to undefined`);
        }
        
        // Create the waypoint with modified data
        update(state => {
          const routes = new Map(state.routes);
          const route = routes.get(routeId);
          
          if (route) {
            const waypoints = [...route.waypoints, { id, ...processedData }];
            
            routes.set(routeId, {
              ...route,
              waypoints
            });
            
            console.log(`Waypoint added to route with ${waypoints.length} total waypoints`);
          } else {
            console.warn(`Route ${routeId} not found`);
          }
          
          return { routes };
        });
      } else {
        // Just use the original data if no date is present
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
      }
      
      // Double-check the waypoint was added with the correct date
      const state = get(routesData);
      const route = state.routes.get(routeId);
      if (route) {
        const addedWaypoint = route.waypoints.find(wp => wp.id === id);
        if (addedWaypoint) {
          console.log(`✅ Verified waypoint added with date: ${addedWaypoint.date || 'undefined'}`);
        }
      }
      
      console.groupEnd();
      return id;
    },
    
    // Update a waypoint
    updateWaypoint: (routeId: string, waypointId: string, waypointData: Partial<Omit<Waypoint, 'id' | 'q' | 'r'>>) => {
      console.group(`[DEBUG] routeStore.updateWaypoint`);
      console.log(`Route ID: ${routeId}, Waypoint ID: ${waypointId}`);
      console.log(`Update data:`, JSON.stringify(waypointData, null, 2));
      
      // Make sure date is properly handled
      if ('date' in waypointData) {
        console.log(`Date provided: ${waypointData.date || 'empty string or undefined'}`);
        
        // Make a copy of the waypoint data to ensure we don't lose the date
        const processedData = { ...waypointData };
        if (processedData.date === '') {
          processedData.date = undefined;
          console.log(`Date converted from empty string to undefined`);
        }
        
        // Update with the processed data
        update(state => {
          const routes = new Map(state.routes);
          const route = routes.get(routeId);
          
          if (route) {
            const waypointIndex = route.waypoints.findIndex(wp => wp.id === waypointId);
            
            if (waypointIndex !== -1) {
              const waypoints = [...route.waypoints];
              const originalWaypoint = { ...waypoints[waypointIndex] };
              
              waypoints[waypointIndex] = {
                ...originalWaypoint,
                ...processedData
              };
              
              console.log(`Waypoint being updated from:`, originalWaypoint);
              console.log(`To:`, waypoints[waypointIndex]);
              
              routes.set(routeId, {
                ...route,
                waypoints
              });
            } else {
              console.warn(`Waypoint ${waypointId} not found in route`);
            }
          } else {
            console.warn(`Route ${routeId} not found`);
          }
          
          return { routes };
        });
      } else {
        // Use original data if no date
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
      }
      
      // Verify the waypoint was updated correctly
      const state = get(routesData);
      const route = state.routes.get(routeId);
      if (route) {
        const updatedWaypoint = route.waypoints.find(wp => wp.id === waypointId);
        if (updatedWaypoint) {
          console.log(`✅ Verified waypoint updated with date: ${updatedWaypoint.date || 'undefined'}`);
        }
      }
      
      console.groupEnd();
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
        console.group('[DEBUG] importRoutesJSON');
        console.log('Input data:', JSON.stringify(jsonData, null, 2));
        
        // Import validateAndSanitizeRoutesJSON dynamically to prevent circular dependencies
        import('../utils/secureRouteImport').then(({ validateAndSanitizeRoutesJSON }) => {
          console.log('Starting validation of route data');
          
          // Validate and sanitize the routes JSON
          const validationResult = validateAndSanitizeRoutesJSON(jsonData, fileSize);
          
          if (!validationResult.isValid || !validationResult.sanitizedData) {
            console.error('Failed to import routes:', validationResult.error);
            console.groupEnd();
            return false;
          }
          
          console.log('Routes validation successful', validationResult);
          
          // Debug - check each route for waypoints with dates
          for (const route of validationResult.sanitizedData) {
            console.group(`Route: ${route.name} (${route.id})`);
            console.log(`${route.waypoints.length} waypoints`);
            
            const waypointsWithDates = route.waypoints.filter(wp => wp.date);
            console.log(`${waypointsWithDates.length} waypoints have dates`);
            
            // Log each waypoint
            route.waypoints.forEach((wp, idx) => {
              console.log(`Waypoint ${idx}: id=${wp.id}, q=${wp.q}, r=${wp.r}, date=${wp.date || 'no date'}`);
            });
            
            console.groupEnd();
          }
          
          // Convert the sanitized array to a Map
          const routesMap = new Map<string, Route>();
          for (const route of validationResult.sanitizedData) {
            routesMap.set(route.id, route);
          }
          
          // Update the store
          set({ routes: routesMap });
          console.log('Routes store updated successfully');
          console.groupEnd();
          return true;
        });
        
        return true; // Return true initially, actual validation happens asynchronously
      } catch (error) {
        console.error('Error importing routes:', error);
        console.groupEnd();
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

// DEBUG: Create a test route with dates
export function createTestRouteWithDates() {
  console.group('[DEBUG] Creating test route with dates');
  
  const today = new Date();
  
  // Create some dates, 3 days apart
  const day1 = new Date(today);
  const day2 = new Date(today);
  day2.setDate(day2.getDate() + 3);
  const day3 = new Date(today);
  day3.setDate(day3.getDate() + 6);
  
  // Format dates as YYYY-MM-DD
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const date1 = formatDate(day1);
  const date2 = formatDate(day2);
  const date3 = formatDate(day3);
  
  console.log(`Test dates: ${date1}, ${date2}, ${date3}`);
  
  // Create the route
  const routeId = routesData.addRoute({
    name: "Test Route With Dates",
    color: "#ff0000"
  });
  
  // Add waypoints with dates
  console.log('Adding waypoints with dates...');
  const wp1Id = routesData.addWaypoint(routeId, { q: 0, r: 0, date: date1 });
  console.log(`Added waypoint 1: ${wp1Id} with date ${date1}`);
  
  const wp2Id = routesData.addWaypoint(routeId, { q: 1, r: 0, date: date2 });
  console.log(`Added waypoint 2: ${wp2Id} with date ${date2}`);
  
  const wp3Id = routesData.addWaypoint(routeId, { q: 2, r: 0, date: date3 });
  console.log(`Added waypoint 3: ${wp3Id} with date ${date3}`);
  
  console.log(`Route created with ID: ${routeId}`);
  
  // Verify the route data
  const state = get(routesData);
  const route = state.routes.get(routeId);
  if (route) {
    console.log(`Route name: ${route.name}`);
    console.log(`Route has ${route.waypoints.length} waypoints`);
    
    route.waypoints.forEach((wp, i) => {
      console.log(`  [${i}] id=${wp.id}, q=${wp.q}, r=${wp.r}, date=${wp.date || 'no date'}`);
    });
    
    // Test the export
    const exported = routesData.exportRoutesJSON();
    console.log('Exported JSON:', JSON.stringify(exported, null, 2));
  }
  
  console.groupEnd();
  return routeId;
}

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
