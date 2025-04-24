import LCToolsSidebarClient from "@/components/lctools-sidebar-client";
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
  title: "Mirane",
};

export default function MiranePage() {
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
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Mirane</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle>Mirane World Setting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Welcome to Mirane, a rich fantasy world for your tabletop roleplaying campaigns. Explore the interactive map, census data, and calendar to bring this world to life.
              </p>
              <p className="mb-4">
                Select a section from the menu to explore different aspects of the Mirane setting:
              </p>

              <div className="grid gap-4 md:grid-cols-3 mt-4">
                <Card className="cursor-pointer hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="12" cy="10" r="2"/><path d="M12 2a8 8 0 0 0-8 8c0 1.892.402 3.13 1.5 4.5L12 22l6.5-7.5c1.098-1.37 1.5-2.608 1.5-4.5a8 8 0 0 0-8-8z"/></svg>
                      Map
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Interactive map of the Mirane world with regions, settlements, and points of interest.</p>
                    <div className="flex mt-4">
                      <a href="/mirane/map" className="text-blue-600 hover:underline">Open Map →</a>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      Census
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Population data, notable NPCs, factions, and demographics of the Mirane world.</p>
                    <div className="flex mt-4">
                      <a href="/mirane/census" className="text-blue-600 hover:underline">Open Census →</a>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 10h18"/><path d="M19 6H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z"/></svg>
                      Calendar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Custom calendar system with holidays, moon phases, and important events in the Mirane world.</p>
                    <div className="flex mt-4">
                      <a href="/mirane/calendar" className="text-blue-600 hover:underline">Open Calendar →</a>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}