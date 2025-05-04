import { ClassAbility, ClassData, getAllClasses } from "./class-utils";

export interface AbilitySearchParams {
  search?: string;
  type?: string | string[];
  keyword?: string | string[];
  range?: string | string[];
  hasMana?: boolean;
  hasRP?: boolean;
  hasAP?: boolean;
}

/**
 * Get all abilities from all classes
 */
export async function getAllAbilities(): Promise<{ ability: ClassAbility; className: string; classId: string }[]> {
  console.log('Loading abilities from classes...');
  
  try {
    // For server-side builds and Vercel deployments, use direct file access instead of API
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      console.log('Using direct file access to load abilities during build...');
      try {
        // Dynamically import modules needed for file access
        const { readFileSync, existsSync } = await import('fs');
        const { join } = await import('path');
        const yaml = await import('js-yaml');
        
        // Try to read the class list JSON file
        const classListPath = join(process.cwd(), 'public/data/class-list.json');
        if (existsSync(classListPath)) {
          // Get the list of class files
          const classFiles = JSON.parse(readFileSync(classListPath, 'utf8'));
          console.log(`Found ${classFiles.length} class files to load abilities from`);
          
          const allAbilities: { ability: ClassAbility; className: string; classId: string }[] = [];
          
          // Loop through each class file and extract abilities
          for (const filename of classFiles) {
            try {
              const yamlPath = join(process.cwd(), 'public/data/classes', filename);
              if (existsSync(yamlPath)) {
                const content = readFileSync(yamlPath, 'utf8');
                const parsed = yaml.load(content) as { class: ClassData };
                const classData = parsed.class;
                
                if (classData && classData.abilities && classData.abilities.length > 0) {
                  const classAbilities = classData.abilities.map(ability => ({
                    ability,
                    className: classData.name,
                    classId: classData.id
                  }));
                  
                  allAbilities.push(...classAbilities);
                  console.log(`Loaded ${classAbilities.length} abilities from ${classData.name}`);
                }
              }
            } catch (err) {
              console.error(`Error loading abilities from class file ${filename}:`, err);
            }
          }
          
          console.log(`Extracted a total of ${allAbilities.length} abilities from all classes`);
          return allAbilities;
        } else {
          console.error('Class list file not found at:', classListPath);
        }
      } catch (err) {
        console.error('Failed to load abilities directly from files:', err);
        // Fall back to API approach if direct loading fails
      }
    }
    
    // Standard approach - get abilities from classes
    console.log('Getting abilities through getAllClasses...');
    const classes = await getAllClasses();
    
    console.log(`Found ${classes.length} classes to extract abilities from`);
    
    // Extract all abilities from all classes
    const allAbilities = classes.flatMap(classData => {
      const classAbilities = classData.abilities || [];
      console.log(`Class ${classData.name} has ${classAbilities.length} abilities`);
      
      return classAbilities.map(ability => ({
        ability,
        className: classData.name,
        classId: classData.id
      }));
    });
    
    console.log(`Extracted a total of ${allAbilities.length} abilities from all classes`);
    return allAbilities;
  } catch (error) {
    console.error('Error getting abilities from classes:', error);
    return [];
  }
}

/**
 * Search abilities based on given parameters
 */
export function searchAbilities(
  abilities: { ability: ClassAbility; className: string; classId: string }[],
  params: AbilitySearchParams
): { ability: ClassAbility; className: string; classId: string }[] {
  return abilities.filter(({ ability }) => {
    // Text search
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      const searchFields = [
        ability.name,
        ability.description,
        ...(ability.keywords || [])
      ];
      
      const matchesSearch = searchFields.some(field => 
        field && field.toLowerCase().includes(searchLower)
      );
      
      if (!matchesSearch) return false;
    }
    
    // Type filter
    if (params.type) {
      if (Array.isArray(params.type)) {
        if (!params.type.includes(ability.type)) return false;
      } else if (ability.type !== params.type) {
        return false;
      }
    }
    
    // Keyword filter
    if (params.keyword) {
      if (Array.isArray(params.keyword)) {
        if (!ability.keywords?.some(k => params.keyword?.includes(k))) return false;
      } else if (!ability.keywords?.includes(params.keyword)) {
        return false;
      }
    }
    
    // Range filter
    if (params.range) {
      if (Array.isArray(params.range)) {
        if (!params.range.includes(ability.range)) return false;
      } else if (ability.range !== params.range) {
        return false;
      }
    }
    
    // Cost filters
    if (params.hasMana && !ability.costs?.mana) {
      return false;
    }
    
    if (params.hasRP && !ability.costs?.rp) {
      return false;
    }
    
    if (params.hasAP && !ability.costs?.ap) {
      return false;
    }
    
    return true;
  });
}

/**
 * Get all unique ability types across all abilities
 */
export function getAllAbilityTypes(
  abilities: { ability: ClassAbility; className: string; classId: string }[]
): string[] {
  const types = new Set<string>();
  
  abilities.forEach(({ ability }) => {
    if (ability.type) types.add(ability.type);
  });
  
  return Array.from(types).sort();
}

/**
 * Get all unique keywords across all abilities
 */
export function getAllKeywords(
  abilities: { ability: ClassAbility; className: string; classId: string }[]
): string[] {
  const keywords = new Set<string>();
  
  abilities.forEach(({ ability }) => {
    if (ability.keywords) {
      ability.keywords.forEach(keyword => keywords.add(keyword));
    }
  });
  
  return Array.from(keywords).sort();
}

/**
 * Get all unique ranges across all abilities
 */
export function getAllRanges(
  abilities: { ability: ClassAbility; className: string; classId: string }[]
): string[] {
  const ranges = new Set<string>();
  
  abilities.forEach(({ ability }) => {
    if (ability.range) ranges.add(ability.range);
  });
  
  return Array.from(ranges).sort();
}