'use client'
import React, { useState, useMemo, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltip, ChartLegend } from '@/components/ui/chart'
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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { FileSpreadsheet } from 'lucide-react'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B']

interface ClassInfo {
  name: string
  tier: number
}

interface Row {
  id: string
  name: string
  race: string
  subRace: string
  spiritCore: number
  sheetUrl: string
  classes: ClassInfo[]
}

export default function CensusClient({ data }: { data: Row[] }) {
  const [nameFilter, setNameFilter] = useState('')
  const [raceFilter, setRaceFilter] = useState('all')
  const [classFilter, setClassFilter] = useState<string[]>([])
  const [showRaceChart, setShowRaceChart] = useState(true)
  const [showSpiritChart, setShowSpiritChart] = useState(true)

  useEffect(() => {
    const sr = localStorage.getItem('census_showRaceChart')
    const ss = localStorage.getItem('census_showSpiritChart')
    if (sr !== null) setShowRaceChart(sr === 'true')
    if (ss !== null) setShowSpiritChart(ss === 'true')
  }, [])

  useEffect(() => {
    localStorage.setItem('census_showRaceChart', showRaceChart ? 'true' : 'false')
    localStorage.setItem('census_showSpiritChart', showSpiritChart ? 'true' : 'false')
  }, [showRaceChart, showSpiritChart])

  function safe(val: unknown, fallback = 'Unknown'): string {
    if (val == null || (typeof val === 'string' && !val.trim())) return fallback
    return String(val)
  }

  const allClasses = useMemo(
    () => Array.from(new Set(data.flatMap((d) => d.classes.map((c) => c.name)))).sort((a, b) => a.localeCompare(b)),
    [data]
  )

  const filtered = useMemo(() => {
    return data.filter((d) => {
      const nameMatch = safe(d.name).toLowerCase().includes(nameFilter.toLowerCase())
      const raceMatch = raceFilter === 'all' || d.race === raceFilter
      const classMatch =
        classFilter.length === 0 ||
        d.classes.some((c) => classFilter.includes(c.name))
      return nameMatch && raceMatch && classMatch
    })
  }, [data, nameFilter, raceFilter, classFilter])

  const raceCounts = useMemo(() =>
    Object.entries(
      filtered.reduce((acc, d) => {
        acc[d.race] = (acc[d.race] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    ),
    [filtered]
  )

  const spiritHistogram = useMemo(() => {
    const bins = Array.from({ length: 12 }, (_, i) => 800 + i * 100)
    return bins.map((start) => {
      const end = start + 99
      const count = filtered.filter((d) => d.spiritCore >= start && d.spiritCore <= end).length
      return { bin: `${start}-${end}`, count }
    })
  }, [filtered])

  const uniqueRaces = Array.from(new Set(data.map((d) => d.race)))

  const [sortBy, setSortBy] = useState<keyof Row>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let v: number
      if (sortBy === 'spiritCore') {
        v = a.spiritCore - b.spiritCore
      } else if (sortBy === 'classes') {
        v = a.classes.map((c) => c.name).join(', ').localeCompare(b.classes.map((c) => c.name).join(', '))
      } else {
        v = String(a[sortBy]).localeCompare(String(b[sortBy]))
      }
      return sortDir === 'asc' ? v : -v
    })
    return arr
  }, [filtered, sortBy, sortDir])

  return (
    <div className="space-y-6 p-4">
      <div className="flex gap-2">
        <button
          className={`px-3 py-1 border rounded ${showRaceChart ? 'bg-primary/10' : 'bg-muted'}`}
          onClick={() => setShowRaceChart((v) => !v)}
        >
          Race
        </button>
        <button
          className={`px-3 py-1 border rounded ${showSpiritChart ? 'bg-primary/10' : 'bg-muted'}`}
          onClick={() => setShowSpiritChart((v) => !v)}
        >
          Spirit
        </button>
      </div>
      <div className="flex gap-4">
        {showRaceChart && (
          <Card className="border shadow overflow-auto" style={{ resize: 'both', minWidth: '300px', minHeight: '200px' }}>
            <CardHeader><CardTitle>Race Distribution</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer id="race" config={{}}>
                <PieChart width={300} height={200}>
                  <Pie
                    data={raceCounts.map(([name, count]) => ({ name, value: count }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={20}
                    outerRadius={40}
                  >
                    {raceCounts.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                  <ChartLegend />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
        {showSpiritChart && (
          <Card className="border shadow overflow-auto" style={{ resize: 'both', minWidth: '300px', minHeight: '200px' }}>
            <CardHeader><CardTitle>Spirit Core Histogram</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer id="spirit" config={{}}>
                <BarChart data={spiritHistogram} width={300} height={200}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bin" />
                  <YAxis allowDecimals={false} />
                  <Bar dataKey="count" fill={COLORS[1]} />
                  <ChartTooltip />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Filter by name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
        />
        <select
          className="border rounded px-2"
          value={raceFilter}
          onChange={(e) => setRaceFilter(e.target.value)}
        >
          <option value="all">All races</option>
          {uniqueRaces.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {allClasses.map((cn) => (
          <Badge
            key={cn}
            variant={classFilter.includes(cn) ? 'secondary' : 'outline'}
            onClick={() =>
              setClassFilter((prev) =>
                prev.includes(cn) ? prev.filter((c) => c !== cn) : [...prev, cn]
              )
            }
            className="cursor-pointer"
          >
            {cn}
          </Badge>
        ))}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {(['Name','Race','Sub-race','Spirit','Classes'] as const).map((col, idx) => (
              <TableHead key={idx}>
                <button onClick={() => {
                  const keys: Array<keyof Row> = ['name','race','subRace','spiritCore','classes']
                  const key = keys[idx]
                  if (sortBy === key) setSortDir((d) => (d==='asc'?'desc':'asc'))
                  else {
                    setSortBy(key)
                    setSortDir('asc')
                  }
                }}>
                  {col} {sortBy===(['name','race','subRace','spiritCore','classes'] as const)[idx] && (sortDir==='asc'?'▲':'▼')}
                </button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((d) => (
            <TableRow key={d.id} className="hover:bg-muted-foreground/10">
              <TableCell>
                <div className="flex items-center gap-1">
                  <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                  <a href={d.sheetUrl} target="_blank" rel="noopener noreferrer">{d.name}</a>
                </div>
              </TableCell>
              <TableCell>{d.race}</TableCell>
              <TableCell>{d.subRace}</TableCell>
              <TableCell>{d.spiritCore}</TableCell>
              <TableCell className="flex flex-wrap gap-1">
                {d.classes.map((c) => (
                  <Badge key={c.name} variant={c.tier===2?'destructive':'secondary'}>
                    {c.name}
                  </Badge>
                ))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
