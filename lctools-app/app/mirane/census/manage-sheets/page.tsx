"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, 
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"
import { LCToolsSidebar } from "@/components/lctools-sidebar"
import LCToolsSidebarClient from "@/components/lctools-sidebar-client";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { 
  isValidGoogleSheetUrl, 
  CharacterSheet, 
  CHARACTER_STATUSES, 
  CharacterStatus
} from '@/lib/supabase'

// Extending the Session types to include Discord ID
type ExtendedUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export default function ManageCharacterSheetsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sheets, setSheets] = useState<CharacterSheet[]>([])
  const [loading, setLoading] = useState(true)
  const [newSheetUrl, setNewSheetUrl] = useState("")
  const [newSheetStatus, setNewSheetStatus] = useState<CharacterStatus>("active")
  const [deleteSheetId, setDeleteSheetId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/mirane/census")
    }
  }, [status, router])

  // Fetch user's character sheets
  useEffect(() => {
    if (status === "authenticated") {
      fetchUserSheets()
    }
  }, [status])

  async function fetchUserSheets() {
    setLoading(true)
    try {
      const response = await fetch('/api/census/sheets/user')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load character sheets')
      }
      
      const data = await response.json()
      setSheets(data || [])
    } catch (error: any) {
      console.error('Error fetching sheets:', error.message)
      toast.error('Failed to load character sheets')
    } finally {
      setLoading(false)
    }
  }

  async function addCharacterSheet() {
    if (status !== "authenticated") {
      toast.error('You must be logged in to add a character sheet')
      return
    }

    if (!isValidGoogleSheetUrl(newSheetUrl)) {
      toast.error('Please enter a valid Google Sheets URL')
      return
    }

    if (sheets.length >= 5) {
      toast.error('You can only have up to 5 character sheets')
      return
    }

    try {
      const response = await fetch('/api/census/sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sheet_url: newSheetUrl,
          status: newSheetStatus
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add character sheet')
      }

      const data = await response.json()
      
      // Update state with new sheet
      setSheets([...(data || []), ...sheets])
      setNewSheetUrl("")
      setNewSheetStatus("active")
      toast.success('Character sheet added successfully')
    } catch (error: any) {
      console.error('Error adding sheet:', error.message)
      toast.error(error.message || 'Failed to add character sheet')
    }
  }

  async function updateSheetStatus(sheetId: string, status: CharacterStatus) {
    try {
      const response = await fetch(`/api/census/sheets/${sheetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update character sheet')
      }

      const data = await response.json()
      
      // Update the sheet in state
      setSheets(sheets.map(sheet => 
        sheet.id === sheetId ? { ...sheet, status } : sheet
      ))
      toast.success('Character sheet status updated')
    } catch (error: any) {
      console.error('Error updating sheet status:', error.message)
      toast.error('Failed to update character sheet')
    }
  }

  async function deleteSheet() {
    if (!deleteSheetId) return
    
    try {
      const response = await fetch(`/api/census/sheets/${deleteSheetId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove character sheet')
      }

      // Remove the deleted sheet from state
      setSheets(sheets.filter(sheet => sheet.id !== deleteSheetId))
      setDeleteSheetId(null)
      setIsDeleteDialogOpen(false)
      toast.success('Character sheet removed')
    } catch (error: any) {
      console.error('Error deleting sheet:', error.message)
      toast.error('Failed to remove character sheet')
    }
  }

  function confirmDelete(sheetId: string) {
    setDeleteSheetId(sheetId)
    setIsDeleteDialogOpen(true)
  }

  if (status === "loading" || loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (status === "unauthenticated") {
    return null // Router will redirect
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
                  <BreadcrumbLink href="/mirane/census">Census</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Manage Sheets</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle>Manage Character Sheets</CardTitle>
              <CardDescription>
                You can add up to 5 character sheets and manage their status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Current Sheets */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Your Character Sheets</h3>
                  {sheets.length === 0 ? (
                    <p className="text-muted-foreground">You haven't added any character sheets yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sheet Link</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
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
                              <RadioGroup
                                value={sheet.status}
                                onValueChange={(value) => 
                                  updateSheetStatus(sheet.id, value as CharacterStatus)
                                }
                                className="flex space-x-3"
                              >
                                {CHARACTER_STATUSES.map((status) => (
                                  <div key={status} className="flex items-center space-x-1">
                                    <RadioGroupItem value={status} id={`status-${sheet.id}-${status}`} />
                                    <Label htmlFor={`status-${sheet.id}-${status}`} className="capitalize">
                                      {status}
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => confirmDelete(sheet.id)}
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>

                {/* Add New Sheet Form */}
                <div className="border p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-4">Add New Character Sheet</h3>
                  
                  {sheets.length >= 5 ? (
                    <p className="text-amber-600">
                      You've reached the maximum limit of 5 character sheets.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="sheet-url">Google Sheet URL</Label>
                        <Input
                          type="url"
                          id="sheet-url"
                          value={newSheetUrl}
                          onChange={(e) => setNewSheetUrl(e.target.value)}
                          placeholder="https://docs.google.com/spreadsheets/..."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Character Status</Label>
                        <RadioGroup
                          value={newSheetStatus}
                          onValueChange={(value) => setNewSheetStatus(value as CharacterStatus)}
                          className="flex space-x-4"
                        >
                          {CHARACTER_STATUSES.map((status) => (
                            <div key={status} className="flex items-center space-x-1">
                              <RadioGroupItem value={status} id={`new-status-${status}`} />
                              <Label htmlFor={`new-status-${status}`} className="capitalize">
                                {status}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                      
                      <Button 
                        onClick={addCharacterSheet}
                        disabled={!newSheetUrl || sheets.length >= 5}
                      >
                        Add Character Sheet
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this character sheet from your collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSheet}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  )
}