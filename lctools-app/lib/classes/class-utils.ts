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
 * This function properly handles Vercel deployments
 */
function getBaseUrl() {
  // For client-side requests, use relative URLs
  if (typeof window !== 'undefined') {
    return '';
  }
  
  // For server-side requests in production (Vercel)
  if (process.env.VERCEL_URL) {
    // Use the correct URL format for Vercel deployments
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // For server-side requests in local development
  return `http://localhost:${process.env.PORT || 3000}`;
}

/**
 * Load all class data from the API
 */
export async function getAllClasses(): Promise<ClassData[]> {
  if (cachedClasses) return cachedClasses;
  
  try {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/classes`;
    
    // During server-side builds, try to fetch from the JSON file directly
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      console.log('Fetching class data from JSON file during build...');
      try {
        // Use dynamic import() instead of require() to avoid ESLint errors
        // This is only used during build time on the server
        const { readFileSync, existsSync } = await import('fs');
        const { join } = await import('path');
        const yaml = await import('js-yaml');
        
        // Try to read the class list JSON file
        const classListPath = join(process.cwd(), 'public/data/class-list.json');
        if (existsSync(classListPath)) {
          // Get the list of class files
          const classFiles = JSON.parse(readFileSync(classListPath, 'utf8'));
          const classesData: ClassData[] = [];
          
          // Loop through each class file and load its data
          for (const filename of classFiles) {
            try {
              const yamlPath = join(process.cwd(), 'public/data/classes', filename);
              if (existsSync(yamlPath)) {
                const content = readFileSync(yamlPath, 'utf8');
                const parsed = yaml.load(content) as { class: ClassData };
                if (parsed && parsed.class) {
                  classesData.push(parsed.class);
                }
              }
            } catch (err) {
              console.error(`Error loading class ${filename}:`, err);
            }
          }
          
          console.log(`Loaded ${classesData.length} classes directly during build`);
          cachedClasses = classesData;
          return classesData;
        }
      } catch (err) {
        console.error('Failed to load classes directly during build:', err);
        // Fall back to API approach if direct loading fails
      }
    }
    
    // Standard API approach for client-side and development
    console.log(`Fetching classes from API: ${url}`);
    const response = await fetch(url, {
      cache: 'no-store',
      next: { revalidate: 3600 } // Revalidate once per hour
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch classes: ${response.status}`);
    }
    
    const data = await response.json();
    cachedClasses = data;
    return data;
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
