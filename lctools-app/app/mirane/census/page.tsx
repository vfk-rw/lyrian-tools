'use client'
import React, { useState, useEffect } from 'react'
import LCToolsSidebarClient from '@/components/lctools-sidebar-client'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import CensusClient from './CensusClient'

interface ClassInfo {
  name: string
  tier: number
}

type Row = {
  id: string
  name: string
  race: string
  subRace: string
  spiritCore: number
  sheetUrl: string
  classes: ClassInfo[]
}

export default function MiraneCensusPage() {
  const [data, setData] = useState<Row[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/census/data')
        const payload = await res.json()
        if (!res.ok) {
          const errorMsg = payload?.error || res.statusText
          throw new Error(errorMsg)
        }
        setData(payload.data)
        setLastUpdated(payload.lastUpdated)
      } catch (e: unknown) {
        if (e instanceof Error) setError(e.message)
        else setError('An unknown error occurred')
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
        <header className="flex h-16 items-center gap-2 px-4">
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
          ) : (
            <>
              <div className="px-4 text-sm text-gray-600">
                Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Unknown'}
              </div>
              {data && data.length > 0 ? (
                <CensusClient data={data} />
              ) : (
                <div>No characters found.</div>
              )}
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
