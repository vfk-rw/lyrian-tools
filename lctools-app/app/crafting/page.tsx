import { LCToolsSidebar } from "@/components/lctools-sidebar"
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
  title: "Crafting",
};

export default function CraftingPage() {
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
                  <BreadcrumbPage>Crafting</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle>Crafting Systems</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Welcome to the crafting hub. Here you'll find tools and resources for various crafting systems used in your TTRPG campaigns.
              </p>
              <p className="mb-4">
                Select a crafting system from the menu to get started:
              </p>

              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <Card className="cursor-pointer hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="m17.64 15 2.5-2.5c.83-.83.83-2.17 0-3 0 0 0 0 0 0a2.12 2.12 0 0 0-3 0l-2.5 2.5"/><path d="m14.5 17.5 2 2"/><path d="m10 8.5 3-3c.83-.83 2.17-.83 3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0 3l-3 3"/><path d="m15.5 2 3 3"/><path d="M11.5 16.5 7 21"/></svg>
                      Blacksmithing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Create weapons, armor, and tools using metals and other materials.</p>
                    <div className="flex mt-4">
                      <a href="/crafting/blacksmithing" className="text-blue-600 hover:underline">Open Blacksmithing →</a>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.58 16.5h12.85"/></svg>
                      Alchemy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Brew potions, poisons, and other magical concoctions.</p>
                    <div className="flex mt-4">
                      <a href="/crafting/alchemy" className="text-blue-600 hover:underline">Open Alchemy →</a>
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