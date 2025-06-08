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
  GraduationCap,
  BookOpen,
  ChevronDown
} from "lucide-react"
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { UserProfileDialog } from "./user-profile-dialog";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

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

interface TocItem {
  id: string
  title: string
  level: number
  children?: TocItem[]
}

interface RulebookSidebarProps extends React.ComponentProps<typeof Sidebar> {
  toc: TocItem[]
  activeSection: string
  onSectionClick: (id: string) => void
}

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
    title: "Rulebook",
    url: "/rulebook",
    icon: BookOpen,
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
    icon: Hammer,
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

export function RulebookSidebar({ toc, activeSection, onSectionClick, ...props }: RulebookSidebarProps) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // After mounting, we have access to the theme
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Debug logging
  React.useEffect(() => {
    console.log("RulebookSidebar received TOC:", toc.length, "items");
  }, [toc]);

  const renderTocItem = (item: TocItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isActive = activeSection === item.id
    
    return (
      <div key={item.id} className={cn("text-sm", depth > 0 && "ml-3")}>
        {hasChildren ? (
          <Collapsible defaultOpen={depth < 2}>
            <div className="flex items-center">
              <CollapsibleTrigger 
                className="flex items-center gap-1 hover:text-primary transition-colors py-1 px-1 rounded-md"
              >
                <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <button
                className={cn(
                  "flex-1 text-left hover:text-primary transition-colors py-1 px-1 rounded-md truncate text-xs",
                  isActive && "text-primary font-medium bg-accent"
                )}
                onClick={() => onSectionClick(item.id)}
              >
                {item.title}
              </button>
            </div>
            <CollapsibleContent className="ml-2">
              {item.children?.map(child => renderTocItem(child, depth + 1))}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <button
            className={cn(
              "block w-full text-left hover:text-primary transition-colors py-1 px-2 rounded-md truncate text-xs",
              isActive && "text-primary font-medium bg-accent"
            )}
            onClick={() => onSectionClick(item.id)}
          >
            {item.title}
          </button>
        )}
      </div>
    )
  }

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
                  defaultOpen={item.title === "Rulebook" ? false : true}
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
        
        {/* Rulebook Table of Contents */}
        {toc.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Rulebook Contents</SidebarGroupLabel>
            <div className="px-2 space-y-1">
              {toc.map(item => renderTocItem(item))}
            </div>
          </SidebarGroup>
        )}
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