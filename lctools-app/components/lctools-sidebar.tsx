"use client"

import * as React from "react"
import {
  Home,
  Info,
  Hammer,
  Map,
  Scroll,
  Users,
  CalendarDays,
  ChevronRight,
  Anvil,
  FlaskRound
} from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
    isActive: true,
  },
  {
    title: "About",
    url: "/about",
    icon: Info,
  },
  {
    title: "Crafting",
    url: "/crafting",
    icon: Hammer,
    items: [
      {
        title: "Blacksmithing",
        url: "/crafting/blacksmithing",
        icon: Anvil,
      },
      {
        title: "Alchemy",
        url: "/crafting/alchemy",
        icon: FlaskRound,
      },
    ],
  },
  {
    title: "Mirane",
    url: "/mirane",
    icon: Map,
    items: [
      {
        title: "Map",
        url: "/mirane/map",
        icon: Map,
      },
      {
        title: "Census",
        url: "/mirane/census",
        icon: Users,
      },
      {
        title: "Calendar",
        url: "/mirane/calendar",
        icon: CalendarDays,
      },
    ],
  },
];

export function LCToolsSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="pb-2">
        <div className="px-2">
          <h1 className="text-lg font-bold">TTRPG Tools</h1>
          <p className="text-xs text-muted-foreground">Your campaign companion</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              item.items ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <a href={subItem.url}>
                                {subItem.icon && <subItem.icon className="mr-2" />}
                                <span>{subItem.title}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive}>
                    <a href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 text-xs text-muted-foreground">
          <p>© 2025 TTRPG Tools</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}