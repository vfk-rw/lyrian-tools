import { ClassAbility, ClassData, ClassProgression, getAllClasses as fetchAllClasses } from "./class-utils";

export interface AbilitySearchParams {
  search?: string;
  type?: string | string[];
  keyword?: string | string[];
  range?: string | string[];
  hasMana?: boolean;
  hasRP?: boolean;
  hasAP?: boolean;
  classIds?: string[];
  level?: number;
}

export interface AbilityWithMetadata {
  ability: ClassAbility;
  className: string;
  classId: string;
  level: number;
}

/**
 * Get all abilities from all classes
 */
export async function getAllAbilities(): Promise<AbilityWithMetadata[]> {
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
          
          const allAbilities: AbilityWithMetadata[] = [];
          
          // Loop through each class file and extract abilities
          for (const filename of classFiles) {
            try {
              const yamlPath = join(process.cwd(), 'public/data/classes', filename);
              if (existsSync(yamlPath)) {
                const content = readFileSync(yamlPath, 'utf8');
                const parsed = yaml.load(content) as { class: ClassData };
                const classData = parsed.class;
                
                if (classData && classData.abilities && classData.abilities.length > 0) {
                  const classAbilities = classData.abilities.map(ability => {
                    // Find the level at which this ability is gained
                    const level = findAbilityLevel(classData.progression, ability);
                    
                    return {
                      ability,
                      className: classData.name,
                      classId: classData.id,
                      level
                    };
                  });
                  
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
    const classes = await fetchAllClasses();
    
    console.log(`Found ${classes.length} classes to extract abilities from`);
    
    // Extract all abilities from all classes
    const allAbilities = classes.flatMap(classData => {
      const classAbilities = classData.abilities || [];
      console.log(`Class ${classData.name} has ${classAbilities.length} abilities`);
      
      return classAbilities.map(ability => {
        // Find the level at which this ability is gained
        const level = findAbilityLevel(classData.progression, ability);
        
        return {
          ability,
          className: classData.name,
          classId: classData.id,
          level
        };
      });
    });
    
    console.log(`Extracted a total of ${allAbilities.length} abilities from all classes`);
    return allAbilities;
  } catch (error) {
    console.error('Error getting abilities from classes:', error);
    return [];
  }
}

/**
 * Find the level at which an ability is gained from class progression
 */
function findAbilityLevel(progression: ClassProgression[], ability: ClassAbility): number {
  // Default to level 1 if we can't find it in progression
  let level = 1;
  
  for (const prog of progression) {
    const hasBenefit = prog.benefits.some(benefit => 
      benefit.type === 'ability' && 
      (benefit.value === ability.id || benefit.value === ability.name)
    );
    
    if (hasBenefit) {
      level = prog.level;
      break;
    }
  }
  
  return level;
}

/**
 * Search abilities based on given parameters
 */
export function searchAbilities(
  abilities: AbilityWithMetadata[],
  params: AbilitySearchParams
): AbilityWithMetadata[] {
  return abilities.filter(({ ability, classId, level }) => {
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
    
    // Class filter
    if (params.classIds && params.classIds.length > 0) {
      if (!params.classIds.includes(classId)) return false;
    }
    
    // Level filter
    if (params.level !== undefined) {
      if (level !== params.level) return false;
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
  abilities: AbilityWithMetadata[]
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
  abilities: AbilityWithMetadata[]
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
  abilities: AbilityWithMetadata[]
): string[] {
  const ranges = new Set<string>();
  
  abilities.forEach(({ ability }) => {
    if (ability.range) ranges.add(ability.range);
  });
  
  return Array.from(ranges).sort();
}

/**
 * Get all unique classes across all abilities
 */
export function getAllClasses(
  abilities: AbilityWithMetadata[]
): { id: string; name: string }[] {
  const classMap = new Map<string, string>();
  
  abilities.forEach(({ className, classId }) => {
    if (!classMap.has(classId)) {
      classMap.set(classId, className);
    }
  });
  
  return Array.from(classMap.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get all unique levels across all abilities
 */
export function getAllLevels(
  abilities: AbilityWithMetadata[]
): number[] {
  const levels = new Set<number>();
  
  abilities.forEach(({ level }) => {
    levels.add(level);
  });
  
  return Array.from(levels).sort((a, b) => a - b);
}