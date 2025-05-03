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
import { getClassById } from "@/lib/classes/class-utils";
import { ClassDetail } from "@/components/classes/class-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// @ts-nocheck - Next.js App Router types are inconsistent
export async function generateMetadata({ params }) {
  const classData = await getClassById(params.id);
  
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
  // Load the class data server-side
  const classData = await getClassById(params.id);
  
  if (!classData) {
    notFound();
  }
  
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
