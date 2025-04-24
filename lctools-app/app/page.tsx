import dynamic from "next/dynamic";
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
import LCToolsSidebarClient from "@/components/lctools-sidebar-client";

export const metadata = {
  title: "Home",
};

export default function Page() {
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
                  <BreadcrumbPage>Home</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to TTRPG Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Your tabletop roleplaying game companion app.</p>
              <p className="text-muted-foreground mt-2">
                Use the navigation sidebar to explore different sections of the app:
              </p>
              <ul className="mt-4 list-disc pl-6 space-y-2">
                <li>
                  <strong>Home</strong> - The main dashboard (you are here)
                </li>
                <li>
                  <strong>About</strong> - Information about this application
                </li>
                <li>
                  <strong>Crafting</strong> - Tools for game crafting systems
                  <ul className="mt-2 list-disc pl-6 space-y-2">
                    <li><strong>Blacksmithing</strong> - Blacksmithing tools and recipes</li>
                    <li><strong>Alchemy</strong> - Potion brewing and ingredients</li>
                  </ul>
                </li>
                <li>
                  <strong>Mirane</strong> - World information for the Mirane setting
                  <ul className="mt-2 list-disc pl-6 space-y-2">
                    <li><strong>Map</strong> - Interactive world map</li>
                    <li><strong>Census</strong> - Population and NPC database</li>
                    <li><strong>Calendar</strong> - World calendar and events</li>
                  </ul>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <div className="grid auto-rows-min gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Access</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Frequently used tools and resources will appear here.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Your recent activity history will be displayed in this section.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
