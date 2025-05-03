import { Metadata } from "next";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import LCToolsSidebarClient from "@/components/lctools-sidebar-client";
import { AbilitySearchClient } from "./abilities-search-client";
import { getAllAbilities, getAllKeywords, getAllRanges } from "@/lib/classes/ability-utils";

export const metadata: Metadata = {
  title: "Abilities | LC TTRPG Tools",
  description: "Search and filter abilities from the Lyrian Chronicles TTRPG"
};

// Mark the page as dynamically rendered
export const dynamic = 'force-dynamic';

export default async function AbilitiesPage() {
  // Load abilities data server-side for initial render
  const allAbilities = await getAllAbilities();
  const keywords = getAllKeywords(allAbilities);
  const ranges = getAllRanges(allAbilities);

  return (
    <SidebarProvider>
      <LCToolsSidebarClient />
      <SidebarInset>
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Abilities</h1>
          <AbilitySearchClient 
            initialAbilities={allAbilities}
            keywords={keywords}
            ranges={ranges}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}