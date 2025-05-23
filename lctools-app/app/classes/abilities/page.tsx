import { Metadata } from "next";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import LCToolsSidebarClient from "@/components/lctools-sidebar-client";
import { AbilitySearchClient } from "./abilities-search-client";
import { ClassAbility, ClassData, ClassProgression } from "@/lib/classes/class-utils";
import { AbilityWithMetadata } from "@/lib/classes/ability-utils";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

export const metadata: Metadata = {
  title: "Abilities | LC TTRPG Tools",
  description: "Search and filter abilities from the Lyrian Chronicles TTRPG"
};

// Don't cache this page
export const revalidate = 0;

// Find the level at which an ability is gained from class progression
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

// Directly load abilities from class files without using API routes
async function getAbilitiesDirectly() {
  console.log('Directly loading abilities from class files...');
  
  try {
    // Get list of class files
    const classListPath = path.join(process.cwd(), 'public/data/class-list.json');
    let classFiles: string[] = [];
    
    if (fs.existsSync(classListPath)) {
      const classListContent = fs.readFileSync(classListPath, 'utf8');
      classFiles = JSON.parse(classListContent);
      console.log(`Found ${classFiles.length} class files to process`);
    } else {
      console.log('Class list not found, scanning directory...');
      // Fallback: scan directory for YAML files
      const classesDir = path.join(process.cwd(), 'public/data/classes');
      classFiles = fs.readdirSync(classesDir).filter(file => file.endsWith('.yaml'));
    }
    
    // Process all class files and extract abilities
    const abilities: AbilityWithMetadata[] = [];
    
    for (const filename of classFiles) {
      try {
        const filePath = path.join(process.cwd(), 'public/data/classes', filename);
        if (!fs.existsSync(filePath)) continue;
        
        const content = fs.readFileSync(filePath, 'utf8');
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
          
          abilities.push(...classAbilities);
          console.log(`Added ${classAbilities.length} abilities from ${classData.name}`);
        }
      } catch (err) {
        console.error(`Error processing ${filename}:`, err);
      }
    }
    
    console.log(`Total abilities loaded: ${abilities.length} from ${new Set(abilities.map(a => a.className)).size} classes`);
    return abilities;
  } catch (error) {
    console.error('Error loading abilities directly:', error);
    return [];
  }
}

// Get unique keywords from abilities
function getAllKeywords(abilities: AbilityWithMetadata[]) {
  const keywords = new Set<string>();
  
  abilities.forEach(({ ability }) => {
    if (ability.keywords) {
      ability.keywords.forEach(keyword => keywords.add(keyword));
    }
  });
  
  return Array.from(keywords).sort();
}

// Get unique ranges from abilities
function getAllRanges(abilities: AbilityWithMetadata[]) {
  const ranges = new Set<string>();
  
  abilities.forEach(({ ability }) => {
    if (ability.range) ranges.add(ability.range);
  });
  
  return Array.from(ranges).sort();
}

// Get unique ability types
function getAllAbilityTypes(abilities: AbilityWithMetadata[]) {
  const types = new Set<string>();
  
  abilities.forEach(({ ability }) => {
    if (ability.type) types.add(ability.type);
  });
  
  return Array.from(types).sort();
}

// Get unique levels
function getAllLevels(abilities: AbilityWithMetadata[]) {
  const levels = new Set<number>();
  
  abilities.forEach(({ level }) => {
    levels.add(level);
  });
  
  return Array.from(levels).sort((a, b) => a - b);
}

export default async function AbilitiesPage() {
  console.log('Rendering abilities page...');
  
  try {
    // Load abilities directly without using API routes
    const allAbilities = await getAbilitiesDirectly();
    console.log(`Rendering with ${allAbilities.length} abilities`);
    
    // Get ability metadata for filters
    const keywords = getAllKeywords(allAbilities);
    const ranges = getAllRanges(allAbilities);
    const types = getAllAbilityTypes(allAbilities);
    const levels = getAllLevels(allAbilities);
    
    console.log(`Found ${keywords.length} keywords, ${ranges.length} ranges, ${levels.length} levels, and ${types.length} ability types`);
    
    return (
      <SidebarProvider>
        <LCToolsSidebarClient />
        <SidebarInset>
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Abilities</h1>
            <p className="mb-4 text-muted-foreground">
              {allAbilities.length} abilities loaded from {new Set(allAbilities.map(a => a.className)).size} classes
            </p>
            <AbilitySearchClient 
              initialAbilities={allAbilities}
              keywords={keywords}
              ranges={ranges}
            />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  } catch (error) {
    console.error('Error rendering abilities page:', error);
    
    // Render an error state
    return (
      <SidebarProvider>
        <LCToolsSidebarClient />
        <SidebarInset>
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Abilities</h1>
            <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
              <h2 className="text-lg font-semibold">Error Loading Abilities</h2>
              <p>Unable to load ability data. Please try refreshing the page.</p>
              <p className="text-sm text-red-600 mt-2">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }
}