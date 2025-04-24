'use client'
import React, { useState, useMemo } from 'react'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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

  const filtered = useMemo(
    () =>
      data.filter(
        (d) =>
          d.name.toLowerCase().includes(nameFilter.toLowerCase()) &&
          (raceFilter !== 'all' ? d.race === raceFilter : true) &&
          (classFilter !== 'all' ? d.classes.includes(classFilter) : true)
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

  const races = Array.from(new Set(data.map((d) => d.race)))
  const classes = Array.from(new Set(data.flatMap((d) => d.classes)))

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
      {/* Charts tabs */}
      <Tabs defaultValue="race" className="w-full max-w-3xl mx-auto mb-8">
        <TabsList className="mb-4 flex justify-center">
          <TabsTrigger value="race">Race Distribution</TabsTrigger>
          <TabsTrigger value="spirit">Spirit Core Histogram</TabsTrigger>
          <TabsTrigger value="class">Class Distribution</TabsTrigger>
        </TabsList>
        <TabsContent value="race">
          <Card className="border shadow">
            <CardHeader>
              <CardTitle>Race Distribution</CardTitle>
            </CardHeader>
            <CardContent style={{ minHeight: 420 }}>
              <div style={{ height: 340 }}>
                <ChartContainer id="race" config={{}}>
                  <PieChart>
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
                    <ChartLegend />
                  </PieChart>
                </ChartContainer>
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
          </Card>
        </TabsContent>
        <TabsContent value="spirit">
          <Card className="border shadow">
            <CardHeader>
              <CardTitle>Spirit Core Histogram</CardTitle>
            </CardHeader>
            <CardContent style={{ minHeight: 420 }}>
              <div style={{ height: 340 }}>
                <ChartContainer id="spirit" config={{}}>
                  <BarChart data={spiritCountsBinned}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bin" label={{ value: 'Spirit Core', position: 'insideBottom', offset: -5 }} />
                    <YAxis allowDecimals={false} label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                    <Bar dataKey="count" fill={COLORS[1]} />
                    <ChartTooltip />
                  </BarChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="class">
          <Card className="border shadow">
            <CardHeader>
              <CardTitle>Class Distribution</CardTitle>
            </CardHeader>
            <CardContent style={{ minHeight: 420 }}>
              <div style={{ height: 340 }}>
                <ChartContainer id="class" config={{}}>
                  <PieChart>
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
                    <ChartLegend />
                  </PieChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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
              {races.map((r) => (
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
              {classes.map((c) => (
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
                <TableCell>{d.name}</TableCell>
                <TableCell>{d.race}</TableCell>
                <TableCell>{d.subRace}</TableCell>
                <TableCell>{d.spiritCore}</TableCell>
                <TableCell>{d.status}</TableCell>
                <TableCell>{d.classes.join(', ')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
