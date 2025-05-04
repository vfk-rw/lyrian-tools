import { notFound } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import LCToolsSidebarClient from "@/components/lctools-sidebar-client";
import { ClassData } from "@/lib/classes/class-utils";
import { ClassDetail } from "@/components/classes/class-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

// Don't cache this page
export const revalidate = 0;

// Load class data directly from files without API
async function getClassDirectly(id: string): Promise<ClassData | null> {
  console.log(`Directly loading class data for: ${id}`);
  
  try {
    // First try loading the class list to find the exact filename
    const classListPath = path.join(process.cwd(), 'public/data/class-list.json');
    
    if (fs.existsSync(classListPath)) {
      const classListContent = fs.readFileSync(classListPath, 'utf8');
      const classFiles = JSON.parse(classListContent);
      
      // Find matching file using flexible matching
      const classFile = classFiles.find(
        (file: string) => 
          file === `${id}.yaml` || // Exact match
          file.toLowerCase() === `${id.toLowerCase()}.yaml` || // Case-insensitive match
          file.replace(/[-_]/g, '').toLowerCase() === id.replace(/[-_]/g, '').toLowerCase() // Normalized match
      );
      
      if (classFile) {
        // Found the matching file
        console.log(`Found matching class file: ${classFile} for ID: ${id}`);
        const filePath = path.join(process.cwd(), 'public/data/classes', classFile);
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = yaml.load(content) as { class: ClassData };
        
        if (parsed && parsed.class) {
          const classData = parsed.class;
          
          // Generate proper image path
          const classId = classData.id || classData.name.toLowerCase().replace(/[\s-]+/g, '_');
          const imageName = `${classId.charAt(0).toUpperCase() + classId.slice(1).replace(/_/g, '-')}.webp`;
          classData.image_url = `/images/classes/${imageName}`;
          
          return classData;
        }
      }
    }
    
    // Fallback to direct attempt if class list not found or no match
    console.log(`Trying direct file access for: ${id}.yaml`);
    const filePath = path.join(process.cwd(), 'public/data/classes', `${id}.yaml`);
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = yaml.load(content) as { class: ClassData };
      
      if (parsed && parsed.class) {
        const classData = parsed.class;
        
        // Generate proper image path
        const classId = classData.id || classData.name.toLowerCase().replace(/[\s-]+/g, '_');
        const imageName = `${classId.charAt(0).toUpperCase() + classId.slice(1).replace(/_/g, '-')}.webp`;
        classData.image_url = `/images/classes/${imageName}`;
        
        return classData;
      }
    }
    
    console.log(`No class found with ID: ${id}`);
    return null;
  } catch (error) {
    console.error(`Error loading class ${id} directly:`, error);
    return null;
  }
}

// @ts-nocheck - Next.js App Router types are inconsistent
export async function generateMetadata({ params }) {
  const classData = await getClassDirectly(params.id);
  
  if (!classData) {
    return {
      title: "Class Not Found",
    };
  }
  
  return {
    title: `${classData.name} - Class Details | LC TTRPG Tools`,
    description: classData.description.split('.')[0],
  };
}

// @ts-nocheck - Next.js App Router types are inconsistent
export default async function ClassDetailPage({ params }) {
  console.log(`Rendering class detail page for ID: ${params.id}`);
  
  // Load the class data directly without API
  const classData = await getClassDirectly(params.id);
  
  if (!classData) {
    console.log(`Class not found: ${params.id}, redirecting to not-found page`);
    notFound();
  }
  
  console.log(`Rendering detail page for: ${classData.name}`);
  
  return (
    <SidebarProvider>
      <LCToolsSidebarClient />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <a href="/">Home</a>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <a href="/classes">Classes</a>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbPage>{classData.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{classData.name}</h1>
            <Button variant="outline" size="sm" asChild>
              <Link href="/classes">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Classes
              </Link>
            </Button>
          </div>
          
          <ClassDetail classData={classData} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
