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
      {/* Charts grid */}
      <div className="grid grid-cols-2 gap-8">
        {/* Status pie */}
        <ChartContainer id="status" config={{}}>
          <PieChart>
            <Pie
              data={statusCounts.map(([name, value]) => ({ name, value }))}
              dataKey="value"
              nameKey="name"
              innerRadius={40}
              outerRadius={80}
              label
            >
              {statusCounts.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <ChartTooltip />
            <ChartLegend />
          </PieChart>
        </ChartContainer>

        {/* Race/subrace pie */}
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
        {drillRace && (
          <button
            className="text-sm text-blue-600 hover:underline mt-2"
            onClick={() => setDrillRace(null)}
          >
            Back to races
          </button>
        )}

        {/* Spirit core histogram */}
        <ChartContainer id="spirit" config={{}}>
          <BarChart data={spiritCounts}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="spirit" />
            <YAxis />
            <Bar dataKey="count" fill={COLORS[1]} />
            <ChartTooltip />
          </BarChart>
        </ChartContainer>

        {/* Class distribution pie */}
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
