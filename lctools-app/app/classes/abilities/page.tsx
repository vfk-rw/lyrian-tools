import { Metadata } from "next";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import LCToolsSidebarClient from "@/components/lctools-sidebar-client";
import { AbilitySearchClient } from "./abilities-search-client";
import { getAllAbilities, getAllKeywords, getAllRanges, getAllAbilityTypes } from "@/lib/classes/ability-utils";

export const metadata: Metadata = {
  title: "Abilities | LC TTRPG Tools",
  description: "Search and filter abilities from the Lyrian Chronicles TTRPG"
};

// Ensure this page is always dynamically rendered to get fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Don't cache this page

export default async function AbilitiesPage() {
  console.log('Rendering abilities page with server-side data');
  
  try {
    // Load abilities data server-side for initial render
    const allAbilities = await getAllAbilities();
    console.log(`Server-side rendering with ${allAbilities.length} abilities`);
    
    // Get ability metadata for filters
    const keywords = getAllKeywords(allAbilities);
    const ranges = getAllRanges(allAbilities);
    const types = getAllAbilityTypes(allAbilities);
    
    console.log(`Found ${keywords.length} keywords, ${ranges.length} ranges, and ${types.length} ability types`);
    
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