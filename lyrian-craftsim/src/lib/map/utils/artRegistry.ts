export interface ArtInfo {
  name: string;
  path: string;
  category: string;
}

import indexRaw from '../../../assets/hex_list.txt?raw';

// Parse hex_list.txt into category objects
function parseHexList(txt: string): Array<{ category: string; files: string[] }> {
  const lines = txt.split(/\r?\n/);
  const categories: Array<{ category: string; files: string[] }> = [];
  let current: { category: string; files: string[] } | null = null;

  for (const line of lines) {
    const match = /[├└]──\s*(.+)$/.exec(line);
    if (match) {
      const name = match[1].trim();
      if (name.toLowerCase().endsWith('.png')) {
        // File entry
        if (current) {
          current.files.push(name);
        }
      } else if (!name.toLowerCase().endsWith('.txt')) {
        // Category entry (ignore .txt lists)
        current = { category: name, files: [] };
        categories.push(current);
      }
    }
  }
  return categories;
}

// Build registry
const parsed = parseHexList(indexRaw);
export const artRegistry: ArtInfo[] = parsed.flatMap(({ category, files }) =>
  files.map(file => {
    const name = file.replace(/\.png$/i, '');
    // URL encode components
    const folder = encodeURIComponent(category);
    const fileEnc = encodeURIComponent(file);
    const path = `/hex_png_256x256/${folder}/${fileEnc}`;
    return { name, path, category };
  })
);

// Categories list
export const artCategories: string[] = parsed.map(p => p.category);

// DEBUG
console.log('[ArtRegistry] loaded art:', artRegistry);
console.log('[ArtRegistry] categories:', artCategories);

// Filter helpers
export function filterArt(registry: ArtInfo[], term: string): ArtInfo[] {
  const lower = term.toLowerCase();
  return registry.filter(a => a.name.toLowerCase().includes(lower));
}

export function filterArtByCategory(registry: ArtInfo[], category: string): ArtInfo[] {
  return registry.filter(a => a.category === category);
}
