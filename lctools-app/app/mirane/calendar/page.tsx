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
  title: "Calendar",
};

export default function MiraneCalendarPage() {
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
                  <BreadcrumbLink href="/mirane">Mirane</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Calendar</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle>Mirane Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                The Mirane world uses a custom calendar system with unique months, days, and celestial cycles. Use this tool to track time in your campaign.
              </p>
              <p className="text-muted-foreground mb-6">
                This is a placeholder for the interactive calendar feature.
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="col-span-2">
                  <div className="bg-muted/50 rounded-md border aspect-[4/3] p-4">
                    <div className="flex justify-between items-center mb-4">
                      <button className="px-2 py-1 bg-muted rounded-md">Previous</button>
                      <h3 className="text-lg font-medium">Month of Ethermoon, 1247</h3>
                      <button className="px-2 py-1 bg-muted rounded-md">Next</button>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center text-xs font-medium p-1">{day}</div>
                      ))}
                      {Array.from({ length: 35 }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`text-center p-2 rounded-md text-sm ${
                            i === 14 ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                          }`}
                        >
                          {i < 3 ? '' : i - 2}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Selected Date</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        <strong>Ethermoon 15, 1247</strong>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">Full Moon</p>
                      <p className="text-sm mt-4">Events:</p>
                      <ul className="text-sm mt-2 space-y-2">
                        <li>Festival of Lights begins</li>
                        <li>Merchant caravan arrives in Silverlake</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Holidays & Festivals</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Placeholder for holiday and festival information throughout the calendar year.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Moon Phases</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Placeholder for moon phase tracking and celestial effects on magic.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Campaign Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Placeholder for tracking campaign events and session dates.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}