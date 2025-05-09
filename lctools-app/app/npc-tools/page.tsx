"use client";

import React from "react";
import LCToolsSidebarClient from "@/components/lctools-sidebar-client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function NPCToolsIndexPage() {
  return (
    <SidebarProvider>
      <LCToolsSidebarClient />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>NPC Tools</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="p-4">
          <Card>
            <CardHeader>
              <CardTitle>NPC Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Welcome to NPC Tools. Use the Stat Calculator to derive your NPCs stats.
              </p>
              <Button asChild>
                <a href="/npc-tools/stat-calculator">Go to Stat Calculator</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
