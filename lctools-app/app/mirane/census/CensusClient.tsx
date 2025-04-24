'use client'
import React, { useState, useMemo, useEffect } from 'react'
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
} from '@/components/ui/chart'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B']

export default function CensusClient({
  data,
}: {
  data: Array<{
    id: string
    name: string
    race: string
    subRace: string
    spiritCore: number
    status: string
    sheetUrl: string
    classes: string[]
  }>
}) {
  const [nameFilter, setNameFilter] = useState('')
  const [raceFilter, setRaceFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [drillRace, setDrillRace] = useState<string | null>(null)
  const [showRaceChart, setShowRaceChart] = useState(true)
  const [showSpiritChart, setShowSpiritChart] = useState(true)
  const [showClassChart, setShowClassChart] = useState(true)

  // Load chart visibility from localStorage
  useEffect(() => {
    setShowRaceChart(localStorage.getItem('census_showRaceChart') !== 'false')
    setShowSpiritChart(localStorage.getItem('census_showSpiritChart') !== 'false')
    setShowClassChart(localStorage.getItem('census_showClassChart') !== 'false')
  }, [])

  // Persist chart visibility to localStorage
  useEffect(() => {
    localStorage.setItem('census_showRaceChart', showRaceChart ? 'true' : 'false')
  }, [showRaceChart])
  useEffect(() => {
    localStorage.setItem('census_showSpiritChart', showSpiritChart ? 'true' : 'false')
  }, [showSpiritChart])
  useEffect(() => {
    localStorage.setItem('census_showClassChart', showClassChart ? 'true' : 'false')
  }, [showClassChart])

  // Helper to normalize blank/null values
  function safe(val: any, fallback = 'Unknown') {
    if (val === null || val === undefined || (typeof val === 'string' && val.trim() === '')) return fallback
    return val
  }

  const filtered = useMemo(
    () =>
      data.filter(
        (d) =>
          safe(d.name, '').toLowerCase().includes(nameFilter.toLowerCase()) &&
          (raceFilter !== 'all' ? safe(d.race) === raceFilter : true) &&
          (classFilter !== 'all' ? d.classes.filter(Boolean).includes(classFilter) : true)
      ),
    [data, nameFilter, raceFilter, classFilter]
  )

  const statusCounts = useMemo(
    () =>
      Object.entries(
        filtered.reduce((acc, d) => {
          acc[d.status] = (acc[d.status] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      ),
    [filtered]
  )

  const raceCounts = useMemo(
    () =>
      Object.entries(
        filtered.reduce((acc, d) => {
          acc[d.race] = (acc[d.race] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      ),
    [filtered]
  )

  const subRaceCounts = useMemo(() => {
    if (!drillRace) return []
    return Object.entries(
      filtered
        .filter((d) => d.race === drillRace)
        .reduce((acc, d) => {
          acc[d.subRace] = (acc[d.subRace] || 0) + 1
          return acc
        }, {} as Record<string, number>)
    )
  }, [filtered, drillRace])

  const spiritCounts = useMemo(
    () =>
      Object.entries(
        filtered.reduce((acc, d) => {
          acc[d.spiritCore] = (acc[d.spiritCore] || 0) + 1
          return acc
        }, {} as Record<number, number>)
      ).map(([k, v]) => ({ spirit: +k, count: v })),
    [filtered]
  )

  // Spirit core histogram binning: bins of 100, from 800 to 2000
  const spiritBins = Array.from({ length: ((2000 - 800) / 100) + 1 }, (_, i) => 800 + i * 100)
  const spiritCountsBinned = spiritBins.map((binStart) => {
    const binEnd = binStart + 99
    const count = filtered.filter(d => d.spiritCore >= binStart && d.spiritCore <= binEnd).length
    return { bin: `${binStart}-${binEnd}`, count }
  })

  // Reverse cumulative spirit core chart data
  const spiritThresholds = [1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000]
  const spiritReverseCumulative = useMemo(() => {
    const under1000 = filtered.filter(d => d.spiritCore < 1000).length
    const result = [
      { label: '<1000', count: under1000 }
    ]
    for (const threshold of spiritThresholds) {
      result.push({
        label: `≥${threshold}`,
        count: filtered.filter(d => d.spiritCore >= threshold).length
      })
    }
    return result
  }, [filtered])

  const allClasses = useMemo(() => filtered.flatMap((d) => d.classes), [filtered])
  const classCounts = useMemo(
    () =>
      Object.entries(
        allClasses.reduce((acc, c) => {
          acc[c] = (acc[c] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      ),
    [allClasses]
  )

  const races = Array.from(new Set(data.map((d) => safe(d.race)))).filter(Boolean)
  const classes = Array.from(new Set(data.flatMap((d) => d.classes && d.classes.length ? d.classes.map((c) => safe(c)) : ['Unknown']))).filter(Boolean)

  return (
    <div className="space-y-8 p-4">
      {/* Status counts summary */}
      <div className="flex flex-wrap gap-6 items-center justify-center mb-4">
        {statusCounts.map(([status, count]) => (
          <div key={status} className="px-4 py-2 rounded bg-muted border text-base font-medium">
            <span className="capitalize">{status}</span>: {count}
          </div>
        ))}
      </div>
      {/* Chart toggles */}
      <div className="flex gap-2 justify-center mb-4">
        <button
          className={`px-3 py-1 rounded border ${showRaceChart ? 'bg-blue-100' : 'bg-gray-100'}`}
          onClick={() => setShowRaceChart((v) => !v)}
        >
          Race Distribution
        </button>
        <button
          className={`px-3 py-1 rounded border ${showSpiritChart ? 'bg-blue-100' : 'bg-gray-100'}`}
          onClick={() => setShowSpiritChart((v) => !v)}
        >
          Spirit Core Histogram
        </button>
        <button
          className={`px-3 py-1 rounded border ${showClassChart ? 'bg-blue-100' : 'bg-gray-100'}`}
          onClick={() => setShowClassChart((v) => !v)}
        >
          Class Distribution
        </button>
      </div>
      {/* Responsive grid for charts - auto-fit, minmax for expansion */}
      <div
        className="grid gap-8 w-full max-w-7xl mx-auto mb-8"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}
      >
        {showRaceChart && (
          <Card className="border shadow w-full min-w-[350px]">
            <div className="aspect-[16/9] flex flex-col">
              <CardHeader>
                <CardTitle>Race Distribution</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center" style={{ minHeight: 0 }}>
                <div className="flex-1 flex flex-row" style={{ height: '100%' }}>
                  <ChartContainer id="race" config={{}}>
                    <PieChart width={undefined} height={undefined} style={{ width: '100%', height: '100%' }}>
                      <Pie
                        data={
                          !drillRace
                            ? raceCounts.map(([name, value]) => ({ name, value }))
                            : subRaceCounts.map(([name, value]) => ({ name, value }))
                        }
                        dataKey="value"
                        nameKey="name"
                        innerRadius={40}
                        outerRadius={80}
                        label
                        onClick={(entry) => {
                          if (!drillRace) setDrillRace(entry.name)
                        }}
                      >
                        {( !drillRace ? raceCounts : subRaceCounts ).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                      <ChartLegend layout="vertical" align="right" verticalAlign="middle" />
                    </PieChart>
                  </ChartContainer>
                  {/* Side legend, scrollable if too tall */}
                  {/* The legend is now inside PieChart, so this div is just for spacing if needed */}
                </div>
                {drillRace && (
                  <button
                    className="text-sm text-blue-600 hover:underline mt-2"
                    onClick={() => setDrillRace(null)}
                  >
                    Back to races
                  </button>
                )}
              </CardContent>
            </div>
          </Card>
        )}
        {showSpiritChart && (
          <Card className="border shadow w-full min-w-[350px]">
            <div className="aspect-[16/9] flex flex-col">
              <CardHeader>
                <CardTitle>Spirit Core Histogram</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center" style={{ minHeight: 0 }}>
                <div className="flex-1" style={{ height: '100%' }}>
                  <ChartContainer id="spirit" config={{}}>
                    <BarChart data={spiritCountsBinned} width={undefined} height={undefined} style={{ width: '100%', height: '100%' }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bin" label={{ value: 'Spirit Core', position: 'insideBottom', offset: -5 }} />
                      <YAxis allowDecimals={false} label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                      <Bar dataKey="count" fill={COLORS[1]} />
                      <ChartTooltip />
                    </BarChart>
                  </ChartContainer>
                </div>
                {/* Reverse cumulative bar chart */}
                <div className="flex-1 mt-8" style={{ height: '100%' }}>
                  <ChartContainer id="spirit-cumulative" config={{}}>
                    <BarChart data={spiritReverseCumulative} width={undefined} height={220} style={{ width: '100%' }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" label={{ value: 'Spirit Core', position: 'insideBottom', offset: -5 }} />
                      <YAxis allowDecimals={false} label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                      <Bar dataKey="count" fill={COLORS[2]} />
                      <ChartTooltip />
                    </BarChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </div>
          </Card>
        )}
        {showClassChart && (
          <Card className="border shadow w-full min-w-[350px]">
            <div className="aspect-[16/9] flex flex-col">
              <CardHeader>
                <CardTitle>Class Distribution</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center" style={{ minHeight: 0 }}>
                <div className="flex-1 flex flex-row" style={{ height: '100%' }}>
                  <ChartContainer id="class" config={{}}>
                    <PieChart width={undefined} height={undefined} style={{ width: '100%', height: '100%' }}>
                      <Pie
                        data={classCounts.map(([name, value]) => ({ name, value }))}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={40}
                        outerRadius={80}
                        label
                      >
                        {classCounts.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                      <ChartLegend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ maxHeight: '80%', overflowY: 'auto', minWidth: 120 }} />
                    </PieChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </div>
          </Card>
        )}
      </div>
      {/* Filters and Data Table */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Filter by name"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
          <Select value={raceFilter} onValueChange={setRaceFilter}>
            <SelectTrigger className="w-40">
              {raceFilter === 'all' ? 'All races' : raceFilter}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {races.filter(Boolean).map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-40">
              {classFilter === 'all' ? 'All classes' : classFilter}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {classes.filter(Boolean).map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Race</TableHead>
              <TableHead>Sub-race</TableHead>
              <TableHead>Spirit Core</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Classes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((d) => (
              <TableRow
                key={d.id}
                onClick={() => window.open(d.sheetUrl, '_blank')}
                className="cursor-pointer hover:bg-gray-100"
              >
                <TableCell>{safe(d.name)}</TableCell>
                <TableCell>{safe(d.race)}</TableCell>
                <TableCell>{safe(d.subRace)}</TableCell>
                <TableCell>{d.spiritCore ?? 'Unknown'}</TableCell>
                <TableCell>{safe(d.status)}</TableCell>
                <TableCell>{Array.isArray(d.classes) && d.classes.length > 0 ? d.classes.filter(Boolean).map((c) => safe(c)).join(', ') : 'Unknown'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
