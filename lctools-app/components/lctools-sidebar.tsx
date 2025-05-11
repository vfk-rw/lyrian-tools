"use client"

import * as React from "react"
import {
  Home,
  Info,
  Hammer,
  Map,
  Users,
  CalendarDays,
  ChevronRight,
  Anvil,
  FlaskRound,
  FileSpreadsheet,
  Sun,
  Moon,
  GraduationCap
} from "lucide-react"
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { UserProfileDialog } from "./user-profile-dialog";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";

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
  },
  {
    title: "About",
    url: "/about",
    icon: Info,
  },
  {
    title: "Classes",
    url: "/classes",
    icon: GraduationCap,
    items: [
      {
        title: "Class List",
        url: "/classes",
        icon: GraduationCap,
      },
      {
        title: "Abilities",
        url: "/classes/abilities",
        icon: ChevronRight,
      },
    ],
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
    title: "Gathering",
    url: "/gathering",
    icon: Hammer, // You can choose a more appropriate icon if desired
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
  {
    title: "NPC Tools",
    url: "/npc-tools",
    icon: FileSpreadsheet,
    items: [
      {
        title: "Stat Calculator",
        url: "/npc-tools/stat-calculator",
        icon: ChevronRight,
      },
    ],
  },
];

export function LCToolsSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // After mounting, we have access to the theme
  React.useEffect(() => {
    setMounted(true);
  }, []);

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
                  defaultOpen={true}
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
                  <SidebarMenuButton asChild tooltip={item.title}>
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
        <div className="px-2 flex items-center justify-center space-x-2">
          <Sun className="w-4 h-4 text-yellow-500" />
          {mounted && (
            <Switch
              checked={resolvedTheme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              aria-label="Toggle theme"
            />
          )}
          <Moon className="w-4 h-4 text-blue-500" />
        </div>
        <div className="px-2 text-xs text-muted-foreground mb-2">
          {status === "loading" ? (
            <p>Loading...</p>
          ) : user ? (
            <div className="flex items-center gap-2">
              <UserProfileDialog />
              <Button size="sm" variant="outline" onClick={() => signOut()} className="ml-auto">Logout</Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => signIn("discord")}>Login with Discord</Button>
          )}
        </div>
        <div className="px-2 text-xs text-muted-foreground">
          <p>© 2025 TTRPG Tools</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
