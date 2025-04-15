import type { Route, Waypoint } from '../stores/routeStore';
import { validateAndSanitizeMapJSON, VALIDATION_LIMITS, validateCoordinate, validateName, validateDescription, validateFileSize } from './secureImport';

/**
 * Constants for route validation limits
 */
export const ROUTE_VALIDATION_LIMITS = {
  ...VALIDATION_LIMITS,  // Include basic validation limits from map import
  
  // Route-specific limits
  MAX_ROUTES_COUNT: 100,
  MAX_WAYPOINTS_PER_ROUTE: 500,
  
  // Allowed color formats
  VALID_COLOR_REGEX: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
};

/**
 * Validates a color string in hex format
 */
export function validateColor(color: string | undefined): string {
  if (!color || !ROUTE_VALIDATION_LIMITS.VALID_COLOR_REGEX.test(color)) {
    return '#ff0000'; // Default to red
  }
  return color;
}

/**
 * Validates a date string in ISO format (YYYY-MM-DD)
 */
export function validateDate(date: string | undefined): string | undefined {
  if (!date) return undefined;
  
  // Validate ISO date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return undefined;
  
  // Validate it's a valid date by parsing it
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return undefined;
  
  // Check if the date is within a reasonable range (e.g., not too far in the past or future)
  const now = new Date();
  const minDate = new Date(now.getFullYear() - 100, 0, 1); // 100 years ago
  const maxDate = new Date(now.getFullYear() + 100, 11, 31); // 100 years in future
  
  if (parsedDate < minDate || parsedDate > maxDate) return undefined;
  
  return date;
}

/**
 * Validates a single Waypoint object
 */
export function validateWaypoint(waypoint: any): Waypoint | null {
  if (!waypoint || typeof waypoint !== 'object') return null;
  
  // Validate required fields
  if (typeof waypoint.q !== 'number' || typeof waypoint.r !== 'number') return null;
  if (!waypoint.id || typeof waypoint.id !== 'string') return null;
  
  // Create validated waypoint
  const validatedWaypoint: Waypoint = {
    id: waypoint.id,
    q: validateCoordinate(waypoint.q),
    r: validateCoordinate(waypoint.r)
  };
  
  // Optional fields
  if (waypoint.date !== undefined) {
    validatedWaypoint.date = validateDate(waypoint.date);
  }
  
  if (waypoint.notes !== undefined) {
    validatedWaypoint.notes = validateDescription(waypoint.notes);
  }
  
  return validatedWaypoint;
}

/**
 * Validates a Route object
 */
export function validateRoute(route: any): Route | null {
  if (!route || typeof route !== 'object') return null;
  
  // Validate required fields
  if (!route.id || typeof route.id !== 'string') return null;
  if (!route.name || typeof route.name !== 'string') return null;
  if (!route.color || typeof route.color !== 'string') return null;
  
  // Create validated route
  const validatedRoute: Route = {
    id: route.id,
    name: validateName(route.name),
    color: validateColor(route.color),
    visible: route.visible !== false, // Default to true if not specified
    editable: false, // Always import as non-editable
    waypoints: []
  };
  
  // Validate waypoints
  if (Array.isArray(route.waypoints)) {
    // Limit number of waypoints per route to prevent DoS attacks
    const waypointsToProcess = route.waypoints.slice(0, ROUTE_VALIDATION_LIMITS.MAX_WAYPOINTS_PER_ROUTE);
    
    for (const waypoint of waypointsToProcess) {
      const validWaypoint = validateWaypoint(waypoint);
      if (validWaypoint) {
        validatedRoute.waypoints.push(validWaypoint);
      }
    }
  }
  
  return validatedRoute;
}

/**
 * Main function to validate and sanitize routes JSON
 */
export function validateAndSanitizeRoutesJSON(
  jsonData: any, 
  fileSize: number
): { isValid: boolean; sanitizedData?: Route[]; error?: string } {
  // Check file size
  if (!validateFileSize(fileSize)) {
    return { isValid: false, error: 'File exceeds maximum size limit of 10MB' };
  }
  
  // Basic structure check
  if (!jsonData || typeof jsonData !== 'object') {
    return { isValid: false, error: 'Invalid JSON structure' };
  }
  
  // Validate routes array
  if (!Array.isArray(jsonData.routes)) {
    return { isValid: false, error: 'Missing or invalid routes array' };
  }
  
  // Sanitize and validate routes
  const sanitizedRoutes: Route[] = [];
  
  // Limit number of routes to prevent DoS attacks
  const routesToProcess = jsonData.routes.slice(0, ROUTE_VALIDATION_LIMITS.MAX_ROUTES_COUNT);
  
  for (const route of routesToProcess) {
    const validRoute = validateRoute(route);
    if (validRoute) {
      sanitizedRoutes.push(validRoute);
    }
  }
  
  // Ensure we have at least one valid route
  if (sanitizedRoutes.length === 0) {
    return { isValid: false, error: 'No valid routes found in the data' };
  }
  
  return { isValid: true, sanitizedData: sanitizedRoutes };
}
