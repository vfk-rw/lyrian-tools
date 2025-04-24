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
  title: "About",
};

export default function AboutPage() {
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
                  <BreadcrumbPage>About</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle>About TTRPG Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-7 mb-4">
                TTRPG Tools is a comprehensive companion application designed to enhance your tabletop roleplaying game experience. Whether you're a player or a game master, our tools help you manage your campaign, track resources, and bring your fantasy worlds to life.
              </p>
              <p className="leading-7 mb-4">
                Built with modern web technologies, TTRPG Tools provides a seamless and intuitive user experience across devices, allowing you to access your campaign information wherever you are.
              </p>
              <p className="leading-7">
                This application is currently in development, with new features being added regularly.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 space-y-2">
                <li>Campaign management and tracking</li>
                <li>Character sheets and NPC databases</li>
                <li>Crafting systems (Blacksmithing, Alchemy)</li>
                <li>World building tools</li>
                <li>Interactive maps</li>
                <li>Custom calendars</li>
                <li>Session notes and planning</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}