import { LCToolsSidebar } from "@/components/lctools-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export const metadata = {
  title: "Blacksmithing",
};

export default function BlacksmithingPage() {
  return (
    <SidebarProvider>
      <LCToolsSidebar />
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
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/crafting">Crafting</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Blacksmithing</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle>Blacksmithing Workshop</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Welcome to the blacksmithing workshop! Here you can craft weapons, armor, and tools for your campaign.
              </p>
              <p className="text-muted-foreground">
                This is a placeholder page for the blacksmithing crafting system.
              </p>
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Placeholder for materials inventory and resource management.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recipes</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Placeholder for blacksmithing recipes and formulae.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}