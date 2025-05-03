import { Metadata } from "next";
import { getAllClasses, getAllRoles } from '@/lib/classes/class-utils';
import { ClassesPageClient } from './classes-page-client';
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import LCToolsSidebarClient from "@/components/lctools-sidebar-client";

export const metadata: Metadata = {
  title: "Classes | LC TTRPG Tools",
  description: "Browse, search and filter classes from the Lyrian Chronicles TTRPG",
};

export default async function ClassesPage() {
  // Load class data server-side for initial render
  const classes = await getAllClasses();
  const roles = getAllRoles(classes);

  return (
    <SidebarProvider>
      <LCToolsSidebarClient />
      <SidebarInset>
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Classes</h1>
          <ClassesPageClient initialClasses={classes} roles={roles} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
