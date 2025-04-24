"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { supabase, CharacterSheet, CHARACTER_TABLE_NAME } from "@/lib/supabase"

// The metadata has been moved to layout.tsx

export default function MiraneCensusPage() {
  const { data: session, status } = useSession()
  const [sheets, setSheets] = useState<CharacterSheet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all character sheets from the database
  useEffect(() => {
    async function fetchAllSheets() {
      setLoading(true)
      setError(null)
      
      try {
        const { data, error } = await supabase
          .from(CHARACTER_TABLE_NAME)
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        setSheets(data || [])
      } catch (err: any) {
        console.error('Error fetching sheets:', err.message)
        setError('Failed to load character sheets')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAllSheets()
  }, [])

  // Helper function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'inactive': return 'secondary'
      case 'retired': return 'warning'
      case 'dead': return 'destructive'
      default: return 'default'
    }
  }

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
                  <BreadcrumbLink href="/mirane">Mirane</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Census</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {status === "authenticated" && (
            <div className="ml-auto mr-4">
              <Button asChild size="sm" variant="outline">
                <Link href="/mirane/census/manage-sheets">
                  Manage Character Sheets
                </Link>
              </Button>
            </div>
          )}
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle>Mirane Census</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                The Mirane Census provides population data, notable characters, and demographic information about the world setting.
              </p>
              
              {/* Character Sheets Section */}
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Character Registry</h3>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : sheets.length === 0 ? (
                  <p className="text-muted-foreground">No character sheets have been registered yet.</p>
                ) : (
                  <Table>
                    <TableCaption>A list of all registered characters</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Character Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Character Sheet</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sheets.map((sheet) => (
                        <TableRow key={sheet.id}>
                          <TableCell>{sheet.character_name}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(sheet.status)}>
                              {sheet.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <a 
                              href={sheet.sheet_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View Sheet
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
            {status === "unauthenticated" && (
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Sign in with Discord to manage your character sheets.
                </p>
              </CardFooter>
            )}
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Notable NPCs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-sm mb-4">Placeholder for NPC database search</div>
                <div className="bg-muted/50 h-48 rounded-md flex items-center justify-center">
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted-foreground mb-2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <p className="text-muted-foreground text-sm">NPC search results will appear here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Factions and Organizations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-sm mb-4">Placeholder for faction data and relationships</div>
                <div className="bg-muted/50 h-48 rounded-md flex items-center justify-center">
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-muted-foreground mb-2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <p className="text-muted-foreground text-sm">Faction information will appear here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Demographics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Population statistics and demographic data for the regions and settlements of Mirane.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-muted/50 h-32 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Race distribution chart</p>
                </div>
                <div className="bg-muted/50 h-32 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Class distribution chart</p>
                </div>
                <div className="bg-muted/50 h-32 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Population density map</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}