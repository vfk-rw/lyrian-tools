// Utility to manage map icons
export interface IconCategory {
  name: string;
  icons: IconInfo[];
}

export interface IconInfo {
  path: string;
  name: string; // Icon name for display and filtering
}

export interface IconRegistry {
  categories: IconCategory[];
  allIcons: IconInfo[]; // Flattened list for search
}

// Helper to format icon name from file path
function formatIconName(fileName: string): string {
  return fileName
    .replace('.svg', '')
    .replace(/-/g, ' ');
}

// Build the registry from the icon list
export function buildIconRegistry(): IconRegistry {
  // Define categories and their icons
  const categories: IconCategory[] = [
    {
      name: 'animal',
      icons: [
        'ammonite-fossil.svg',
        'ammonite.svg',
        'angler-fish.svg',
        'angular-spider.svg',
        'animal-hide.svg',
        'animal-skull.svg',
        'armadillo-tail.svg',
        'axolotl.svg',
        'bat-wing.svg',
        'bat.svg',
        'bear-face.svg',
        'bear-head.svg',
        'bee.svg',
        'big-egg.svg',
        'bird-twitter.svg',
        'boar-tusks.svg',
        'bull-horns.svg',
        'bull.svg',
        'bunny-slippers.svg',
        'butterfly-warning.svg',
        'butterfly.svg',
        'cat.svg',
        'cow.svg',
        'crab.svg',
        'crocodile.svg',
        'deer-track.svg',
        'dinosaur-rex.svg',
        'dog-house.svg',
        'dolphin.svg',
        'dragon.svg',
        'eagle-emblem.svg',
        'elephant.svg',
        'fish.svg',
        'fox-head.svg',
        'frog.svg',
        'goat.svg',
        'horse-head.svg',
        'lion.svg',
        'owl.svg',
        'paw-print.svg',
        'rabbit.svg',
        'rat.svg',
        'scorpion.svg',
        'shark.svg',
        'snake.svg',
        'spider-web.svg',
        'tiger.svg',
        'turtle.svg',
        'wolf-head.svg'
      ].map(file => ({
        path: `/src/assets/icons/animal/${file}`,
        name: formatIconName(file)
      }))
    },
    {
      name: 'building',
      icons: [
        '3d-stairs.svg',
        'ancient-ruins.svg',
        'arena.svg',
        'barn.svg',
        'castle.svg',
        'church.svg',
        'city.svg',
        'dam.svg',
        'factory.svg',
        'family-house.svg',
        'gate.svg',
        'greek-temple.svg',
        'home.svg',
        'hut.svg',
        'lighthouse.svg',
        'mill.svg',
        'mine.svg',
        'observatory.svg',
        'pyramid.svg',
        'ruins.svg',
        'shop.svg',
        'stable.svg',
        'temple.svg',
        'tomb.svg',
        'tower.svg',
        'village.svg',
        'well.svg',
        'windmill.svg'
      ].map(file => ({
        path: `/src/assets/icons/building/${file}`,
        name: formatIconName(file)
      }))
    },
    {
      name: 'nature',
      icons: [
        'caldera.svg',
        'cave-entrance.svg',
        'desert.svg',
        'field.svg',
        'forest.svg',
        'globe.svg',
        'grass.svg',
        'hills.svg',
        'jungle.svg',
        'mountain-cave.svg',
        'mountains.svg',
        'oasis.svg',
        'pine-tree.svg',
        'river.svg',
        'sea-cliff.svg',
        'smoking-volcano.svg',
        'stone-stack.svg',
        'sunset.svg',
        'swamp.svg',
        'trail.svg',
        'volcano.svg',
        'waterfall.svg'
      ].map(file => ({
        path: `/src/assets/icons/nature/${file}`,
        name: formatIconName(file)
      }))
    },
    {
      name: 'civilization',
      icons: [
        'byzantin-temple.svg',
        'capitol.svg',
        'castle.svg',
        'congress.svg',
        'egyptian-temple.svg',
        'granary.svg',
        'huts-village.svg',
        'indian-palace.svg',
        'moai.svg',
        'modern-city.svg',
        'pagoda.svg',
        'saint-basil-cathedral.svg',
        'viking-church.svg',
        'village.svg'
      ].map(file => ({
        path: `/src/assets/icons/civilization/${file}`,
        name: formatIconName(file)
      }))
    }
  ];
  
  // Create flattened list for searching
  const allIcons = categories.flatMap(category => category.icons);
  
  return {
    categories,
    allIcons
  };
}

// Exported registry instance
export const iconRegistry = buildIconRegistry();

// Function to filter icons by search term
export function filterIcons(registry: IconRegistry, searchTerm: string): IconInfo[] {
  if (!searchTerm) return registry.allIcons;
  
  const term = searchTerm.toLowerCase();
  return registry.allIcons.filter(icon => 
    icon.name.toLowerCase().includes(term)
  );
}

// Function to filter icons by category
export function filterIconsByCategory(registry: IconRegistry, category: string): IconInfo[] {
  const targetCategory = registry.categories.find(c => c.name === category);
  return targetCategory ? targetCategory.icons : [];
}
