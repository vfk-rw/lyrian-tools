'use client'
import React, { useState, useEffect } from 'react'
import LCToolsSidebarClient from '@/components/lctools-sidebar-client'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import CensusClient from './CensusClient'

type RawRow = {
  id: string
  status: string
  sheet_url: string
  character_info: Array<{ name: string; race: string; sub_race: string; spirit_core: number }>
  character_class_info: Array<{ class_name: string }>
}

type ProcessedRow = {
  id: string
  name: string
  race: string
  subRace: string
  spiritCore: number
  status: string
  sheetUrl: string
  classes: string[]
}

function hasErrorString(obj: unknown): obj is { error: string } {
  return typeof obj === 'object' && obj !== null && 'error' in obj && typeof (obj as { error: unknown }).error === 'string';
}

export default function MiraneCensusPage() {
  const [data, setData] = useState<ProcessedRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/census/data')
        const raw = await res.json()
        if (!res.ok) {
          let errorMsg = res.statusText;
          if (hasErrorString(raw)) {
            errorMsg = raw.error;
          }
          throw new Error(errorMsg);
        }
        const json: RawRow[] = raw
        setData(
          json.map((row) => ({
            id: row.id,
            name: row.character_info[0]?.name ?? '',
            race: row.character_info[0]?.race ?? '',
            subRace: row.character_info[0]?.sub_race ?? '',
            spiritCore: row.character_info[0]?.spirit_core ?? 0,
            status: row.status,
            sheetUrl: row.sheet_url,
            classes: row.character_class_info.map((c) => c.class_name),
          }))
        )
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message)
        } else {
          setError('An unknown error occurred')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
                <BreadcrumbLink href="/mirane">Mirane</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Census</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {loading ? (
            <div>Loading census data...</div>
          ) : error ? (
            <div className="text-red-600">Error loading census data: {error}</div>
          ) : data && data.length > 0 ? (
            <CensusClient data={data} />
          ) : (
            <div>No characters found.</div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}