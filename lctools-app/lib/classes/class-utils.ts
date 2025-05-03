// Type definitions for class data
export interface ClassAbility {
  id: string;
  name: string;
  type: string;
  keywords: string[];
  range: string;
  description: string;
  costs?: {
    mana?: number;
    rp?: number;
    ap?: number;
  };
  requirements?: Array<{
    type: string;
    description: string;
  }>;
}

export interface ClassProgression {
  level: number;
  benefits: Array<{
    type: string;
    value?: string;
    points?: number;
    eligible_skills?: string[];
    can_convert_to_expertise?: boolean;
    conversion_ratio?: number;
    choose?: number;
    options?: Array<{
      attribute: string;
      value: number;
    }>;
  }>;
}

export interface ClassData {
  id: string;
  name: string;
  tier: number;
  difficulty: number;
  main_role: string;
  secondary_role: string | null;
  image_url: string;
  requirements: {
    type: string;
    conditions: Array<{
      type: string;
      description: string;
      value?: string | string[];
      options?: string[];
      points?: number;
    }>;
  };
  description: string;
  guide: string;
  progression: ClassProgression[];
  abilities: ClassAbility[];
}

export interface ClassSearchParams {
  search?: string;
  tier?: number | number[];
  mainRole?: string;
  secondaryRole?: string;
  difficulty?: number | number[];
}

// Client-side cache
let cachedClasses: ClassData[] | null = null;

/**
 * Get the API base URL depending on environment
 */
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Browser should use relative path
    return '';
  }
  
  // SSR should use absolute URL
  return process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : `http://localhost:${process.env.PORT || 3000}`;
}

/**
 * Load all class data from the API
 */
export async function getAllClasses(): Promise<ClassData[]> {
  if (cachedClasses) return cachedClasses;
  
  try {
    // In development or when running the app normally, use the API
    if (process.env.NODE_ENV === 'development' || typeof window !== 'undefined') {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/classes`, {
        cache: 'no-store',
        next: { revalidate: 3600 } // Revalidate once per hour
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch classes: ${response.status}`);
      }
      
      const data = await response.json();
      cachedClasses = data;
      return data;
    } 
    // During build time, use a static empty array
    // This is fine because the page will be dynamically populated on the client
    else {
      console.log('Using empty class data for static build');
      cachedClasses = [];
      return [];
    }
  } catch (error) {
    console.error('Error fetching classes:', error);
    return [];
  }
}

/**
 * Get a single class by ID from the API
 */
export async function getClassById(id: string): Promise<ClassData | null> {
  try {
    // First check the cache
    if (cachedClasses) {
      const cachedClass = cachedClasses.find(c => c.id === id);
      if (cachedClass) return cachedClass;
    }
    
    // If not in cache, fetch from API
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/classes/details?id=${id}`, {
      cache: 'no-store',
      next: { revalidate: 3600 } // Revalidate once per hour
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch class: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching class ${id}:`, error);
    return null;
  }
}

/**
 * Search and filter classes based on criteria
 */
export function searchClasses(
  classes: ClassData[],
  params: ClassSearchParams
): ClassData[] {
  return classes.filter(classData => {
    // Text search
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      const searchFields = [
        classData.name,
        classData.description,
        classData.main_role,
        classData.secondary_role,
        ...(classData.abilities?.map(a => a.name) || []),
        ...(classData.abilities?.map(a => a.description) || [])
      ].filter(Boolean);
      
      const matchesSearch = searchFields.some(field => 
        field && field.toLowerCase().includes(searchLower)
      );
      
      if (!matchesSearch) return false;
    }
    
    // Tier filter
    if (params.tier) {
      if (Array.isArray(params.tier)) {
        if (!params.tier.includes(classData.tier)) return false;
      } else if (classData.tier !== params.tier) {
        return false;
      }
    }
    
    // Main role filter
    if (params.mainRole && classData.main_role !== params.mainRole) {
      return false;
    }
    
    // Secondary role filter
    if (params.secondaryRole) {
      if (params.secondaryRole === 'None') {
        if (classData.secondary_role !== null) return false;
      } else if (classData.secondary_role !== params.secondaryRole) {
        return false;
      }
    }
    
    // Difficulty filter
    if (params.difficulty) {
      if (Array.isArray(params.difficulty)) {
        if (!params.difficulty.includes(classData.difficulty)) return false;
      } else if (classData.difficulty !== params.difficulty) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Get all unique roles from classes
 */
export function getAllRoles(classes: ClassData[]): string[] {
  const roles = new Set<string>();
  
  classes.forEach(classData => {
    if (classData.main_role) roles.add(classData.main_role);
    if (classData.secondary_role) roles.add(classData.secondary_role);
  });
  
  return Array.from(roles).sort();
}
