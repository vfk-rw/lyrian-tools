import { Metadata } from "next";
import { ClassData, getAllRoles } from '@/lib/classes/class-utils';
import { ClassesPageClient } from './classes-page-client';
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import LCToolsSidebarClient from "@/components/lctools-sidebar-client";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

export const metadata: Metadata = {
  title: "Classes | LC TTRPG Tools",
  description: "Browse, search and filter classes from the Lyrian Chronicles TTRPG",
};

// Don't cache this page
export const revalidate = 0;

// Directly load classes from files without using API routes
async function getClassesDirectly(): Promise<ClassData[]> {
  console.log('Directly loading classes from files...');
  
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
    
    // Process all class files
    const classes: ClassData[] = [];
    
    for (const filename of classFiles) {
      try {
        const filePath = path.join(process.cwd(), 'public/data/classes', filename);
        if (!fs.existsSync(filePath)) continue;
        
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = yaml.load(content) as { class: ClassData };
        const classData = parsed.class;
        
        if (classData) {
          // Generate proper image path
          const classId = classData.id || classData.name.toLowerCase().replace(/[\s-]+/g, '_');
          const imageName = `${classId.charAt(0).toUpperCase() + classId.slice(1).replace(/_/g, '-')}.webp`;
          classData.image_url = `/images/classes/${imageName}`;
          
          classes.push(classData);
        }
      } catch (err) {
        console.error(`Error processing ${filename}:`, err);
      }
    }
    
    console.log(`Total classes loaded: ${classes.length}`);
    return classes;
  } catch (error) {
    console.error('Error loading classes directly:', error);
    return [];
  }
}

export default async function ClassesPage() {
  console.log('Rendering classes page...');
  
  try {
    // Load class data directly without using API routes
    const classes = await getClassesDirectly();
    const roles = getAllRoles(classes);
    
    console.log(`Rendering with ${classes.length} classes and ${roles.length} roles`);

    return (
      <SidebarProvider>
        <LCToolsSidebarClient />
        <SidebarInset>
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Classes</h1>
            <p className="mb-4 text-muted-foreground">
              {classes.length} classes loaded
            </p>
            <ClassesPageClient initialClasses={classes} roles={roles} />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  } catch (error) {
    console.error('Error rendering classes page:', error);
    
    // Render an error state
    return (
      <SidebarProvider>
        <LCToolsSidebarClient />
        <SidebarInset>
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Classes</h1>
            <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
              <h2 className="text-lg font-semibold">Error Loading Classes</h2>
              <p>Unable to load class data. Please try refreshing the page.</p>
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
