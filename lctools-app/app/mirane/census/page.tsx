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
import { CharacterSheet } from "@/lib/supabase"

// The metadata has been moved to layout.tsx

export default function MiraneCensusPage() {
  const { data: session, status } = useSession()
  const [sheets, setSheets] = useState<CharacterSheet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all character sheets using the API
  useEffect(() => {
    async function fetchAllSheets() {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch('/api/census/sheets')
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to load character sheets')
        }
        
        const data = await response.json()
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
              <CardTitle>Mirane Character Registry</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6">
                The Character Registry tracks all player characters in the world of Mirane.
                Status indicators show whether characters are currently active in the story or not.
              </p>
              
              {/* Character Sheets Section */}
              <div>
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
                        <TableHead>Character Sheet URL</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sheets.map((sheet) => (
                        <TableRow key={sheet.id}>
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
                          <TableCell>
                            <Badge variant={getStatusColor(sheet.status)}>
                              {sheet.status}
                            </Badge>
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}