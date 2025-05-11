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
  expeditionDeparture?: string
  expeditionReturn?: string
  ipLockoutEnd?: string
}

export default function CensusClient({ data }: { data: Row[] }) {
  const [nameFilter, setNameFilter] = useState('')
  const [raceFilter, setRaceFilter] = useState('all')
  const [classFilter, setClassFilter] = useState<string[]>([])
  const [showRaceChart, setShowRaceChart] = useState(false)
  const [showSpiritChart, setShowSpiritChart] = useState(false)
  const [showCumulativeSpiritChart, setShowCumulativeSpiritChart] = useState(false)
  const [showTier1ClassChart, setShowTier1ClassChart] = useState(false)
  const [showTier2ClassChart, setShowTier2ClassChart] = useState(false)
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 })

  // Reference for chart container div to measure its size
  const raceChartRef = React.useRef<HTMLDivElement>(null)
  const spiritChartRef = React.useRef<HTMLDivElement>(null)
  const cumulativeSpiritChartRef = React.useRef<HTMLDivElement>(null)
  const tier1ClassChartRef = React.useRef<HTMLDivElement>(null)
  const tier2ClassChartRef = React.useRef<HTMLDivElement>(null)

  // Update chart size when container dimensions change
  useEffect(() => {
    const updateChartSize = () => {
      if (raceChartRef.current) {
        const width = raceChartRef.current.clientWidth - 40 // Subtract padding
        const height = raceChartRef.current.clientHeight - 80 // Subtract header height and padding
        setChartSize({ width: Math.max(width, 200), height: Math.max(height, 200) })
      }
    }

    // Initial size update
    updateChartSize()

    // Add resize listener
    const resizeObserver = new ResizeObserver(updateChartSize)
    if (raceChartRef.current) {
      resizeObserver.observe(raceChartRef.current)
    }
    if (spiritChartRef.current) {
      resizeObserver.observe(spiritChartRef.current)
    }
    if (cumulativeSpiritChartRef.current) {
      resizeObserver.observe(cumulativeSpiritChartRef.current)
    }
    if (tier1ClassChartRef.current) {
      resizeObserver.observe(tier1ClassChartRef.current)
    }
    if (tier2ClassChartRef.current) {
      resizeObserver.observe(tier2ClassChartRef.current)
    }

    window.addEventListener('resize', updateChartSize)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateChartSize)
    }
  }, [showRaceChart, showSpiritChart, showCumulativeSpiritChart, showTier1ClassChart, showTier2ClassChart])

  useEffect(() => {
    const sr = localStorage.getItem('census_showRaceChart')
    const ss = localStorage.getItem('census_showSpiritChart')
    const scs = localStorage.getItem('census_showCumulativeSpiritChart')
    const st1c = localStorage.getItem('census_showTier1ClassChart')
    const st2c = localStorage.getItem('census_showTier2ClassChart')
    if (sr !== null) setShowRaceChart(sr === 'true')
    if (ss !== null) setShowSpiritChart(ss === 'true')
    if (scs !== null) setShowCumulativeSpiritChart(scs === 'true')
    if (st1c !== null) setShowTier1ClassChart(st1c === 'true')
    if (st2c !== null) setShowTier2ClassChart(st2c === 'true')
  }, [])

  useEffect(() => {
    localStorage.setItem('census_showRaceChart', showRaceChart ? 'true' : 'false')
    localStorage.setItem('census_showSpiritChart', showSpiritChart ? 'true' : 'false')
    localStorage.setItem('census_showCumulativeSpiritChart', showCumulativeSpiritChart ? 'true' : 'false')
    localStorage.setItem('census_showTier1ClassChart', showTier1ClassChart ? 'true' : 'false')
    localStorage.setItem('census_showTier2ClassChart', showTier2ClassChart ? 'true' : 'false')
  }, [showRaceChart, showSpiritChart, showCumulativeSpiritChart, showTier1ClassChart, showTier2ClassChart])

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

  const cumulativeSpiritHistogram = useMemo(() => {
    // Define thresholds starting with <1000, then >=1000, >=1100, etc. up to >=2000
    const thresholds = [
      { label: '<1000', min: 0, max: 999 },
      ...Array.from({ length: 11 }, (_, i) => {
        const value = 1000 + i * 100;
        return { label: `≥${value}`, min: value, max: 9999 }; // 9999 as arbitrary upper limit
      })
    ];

    return thresholds.map(({ label, min, max }) => {
      const count = filtered.filter((d) => d.spiritCore >= min && d.spiritCore <= max).length;
      return { bin: label, count };
    });
  }, [filtered]);

  const tier1ClassCounts = useMemo(() => {
    // Count all tier 1 classes across all filtered characters
    const counts: Record<string, number> = {};
    filtered.forEach(character => {
      character.classes
        .filter(c => c.tier === 1)
        .forEach(c => {
          counts[c.name] = (counts[c.name] || 0) + 1;
        });
    });
    
    // Sort by count (descending)
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [filtered]);

  const tier2ClassCounts = useMemo(() => {
    // Count all tier 2 classes across all filtered characters
    const counts: Record<string, number> = {};
    filtered.forEach(character => {
      character.classes
        .filter(c => c.tier === 2)
        .forEach(c => {
          counts[c.name] = (counts[c.name] || 0) + 1;
        });
    });
    
    // Sort by count (descending)
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [filtered]);

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
      <div className="flex justify-between items-center">
        <div className="text-lg font-medium">Characters: {filtered.length}</div>
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
          <button
            className={`px-3 py-1 border rounded ${showCumulativeSpiritChart ? 'bg-primary/10' : 'bg-muted'}`}
            onClick={() => setShowCumulativeSpiritChart((v) => !v)}
          >
            Cumulative Spirit
          </button>
          <button
            className={`px-3 py-1 border rounded ${showTier1ClassChart ? 'bg-primary/10' : 'bg-muted'}`}
            onClick={() => setShowTier1ClassChart((v) => !v)}
          >
            Tier 1 Classes
          </button>
          <button
            className={`px-3 py-1 border rounded ${showTier2ClassChart ? 'bg-primary/10' : 'bg-muted'}`}
            onClick={() => setShowTier2ClassChart((v) => !v)}
          >
            Tier 2 Classes
          </button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        {showRaceChart && (
          <Card 
            ref={raceChartRef}
            className="border shadow overflow-auto flex-1" 
            style={{ resize: 'both', minWidth: '300px', minHeight: '300px', height: '400px' }}
          >
            <CardHeader><CardTitle>Race Distribution</CardTitle></CardHeader>
            <CardContent className="h-full">
              {chartSize.width > 0 && chartSize.height > 0 && (
                <ChartContainer id="race" config={{}}>
                  <PieChart width={chartSize.width} height={chartSize.height}>
                    <Pie
                      data={raceCounts.map(([name, count]) => ({ name, value: count }))}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={chartSize.height * 0.1}
                      outerRadius={chartSize.height * 0.3}
                      cx="50%"
                      cy="50%"
                    >
                      {raceCounts.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                    <ChartLegend layout="vertical" align="right" verticalAlign="middle" />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        )}
        {showSpiritChart && (
          <Card 
            ref={spiritChartRef}
            className="border shadow overflow-auto flex-1" 
            style={{ resize: 'both', minWidth: '300px', minHeight: '300px', height: '400px' }}
          >
            <CardHeader><CardTitle>Spirit Core Histogram</CardTitle></CardHeader>
            <CardContent className="h-full">
              {chartSize.width > 0 && chartSize.height > 0 && (
                <ChartContainer id="spirit" config={{}}>
                  <BarChart 
                    data={spiritHistogram} 
                    width={chartSize.width} 
                    height={chartSize.height}
                    margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bin" angle={-45} textAnchor="end" height={50} />
                    <YAxis allowDecimals={false} />
                    <Bar dataKey="count" fill={COLORS[1]} />
                    <ChartTooltip />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      {showCumulativeSpiritChart && (
        <Card 
          ref={cumulativeSpiritChartRef}
          className="border shadow overflow-auto flex-1" 
          style={{ resize: 'both', minWidth: '300px', minHeight: '300px', height: '400px' }}
        >
          <CardHeader><CardTitle>Cumulative Spirit Core Distribution</CardTitle></CardHeader>
          <CardContent className="h-full">
            {chartSize.width > 0 && chartSize.height > 0 && (
              <ChartContainer id="cumulativeSpirit" config={{}}>
                <BarChart 
                  data={cumulativeSpiritHistogram} 
                  width={chartSize.width} 
                  height={chartSize.height}
                  margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bin" angle={-45} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} />
                  <Bar dataKey="count" fill={COLORS[2]} />
                  <ChartTooltip />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}
      
      <div className="flex flex-col md:flex-row gap-4">
        {showTier1ClassChart && (
          <Card 
            ref={tier1ClassChartRef}
            className="border shadow overflow-auto flex-1" 
            style={{ resize: 'both', minWidth: '300px', minHeight: '300px', height: '400px' }}
          >
            <CardHeader><CardTitle>Tier 1 Class Distribution</CardTitle></CardHeader>
            <CardContent className="h-full">
              {chartSize.width > 0 && chartSize.height > 0 && (
                <ChartContainer id="tier1Classes" config={{}}>
                  <PieChart width={chartSize.width} height={chartSize.height}>
                    <Pie
                      data={tier1ClassCounts}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={chartSize.height * 0.1}
                      outerRadius={chartSize.height * 0.3}
                      cx="50%"
                      cy="50%"
                    >
                      {tier1ClassCounts.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                    <ChartLegend layout="vertical" align="right" verticalAlign="middle" />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        )}
        
        {showTier2ClassChart && (
          <Card 
            ref={tier2ClassChartRef}
            className="border shadow overflow-auto flex-1" 
            style={{ resize: 'both', minWidth: '300px', minHeight: '300px', height: '400px' }}
          >
            <CardHeader><CardTitle>Tier 2 Class Distribution</CardTitle></CardHeader>
            <CardContent className="h-full">
              {chartSize.width > 0 && chartSize.height > 0 && (
                <ChartContainer id="tier2Classes" config={{}}>
                  <PieChart width={chartSize.width} height={chartSize.height}>
                    <Pie
                      data={tier2ClassCounts}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={chartSize.height * 0.1}
                      outerRadius={chartSize.height * 0.3}
                      cx="50%"
                      cy="50%"
                    >
                      {tier2ClassCounts.map((_, i) => (
                        <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                    <ChartLegend layout="vertical" align="right" verticalAlign="middle" />
                  </PieChart>
                </ChartContainer>
              )}
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
            {(['Name','Race','Sub-race','Spirit','Expedition Departure','Expedition Return','IP Lockout','Classes'] as const).map((col, idx) => (
              <TableHead key={idx}>
                <button onClick={() => {
                  const keys: Array<keyof Row> = ['name','race','subRace','spiritCore','expeditionDeparture','expeditionReturn','ipLockoutEnd','classes']
                  const key = keys[idx]
                  if (sortBy === key) setSortDir((d) => (d==='asc'?'desc':'asc'))
                  else {
                    setSortBy(key)
                    setSortDir('asc')
                  }
                }}>
                  {col} {sortBy===(['name','race','subRace','spiritCore','expeditionDeparture','expeditionReturn','ipLockoutEnd','classes'] as const)[idx] && (sortDir==='asc'?'▲':'▼')}
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
              <TableCell>{d.expeditionDeparture || '-'}</TableCell>
              <TableCell>{d.expeditionReturn || '-'}</TableCell>
              <TableCell>{d.ipLockoutEnd || '-'}</TableCell>
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
