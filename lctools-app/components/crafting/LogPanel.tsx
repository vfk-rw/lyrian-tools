'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { CraftingState } from '@/lib/crafting/types'

interface LogPanelProps {
  state: CraftingState
}

export default function LogPanel({ state }: LogPanelProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Log</CardTitle></CardHeader>
      <CardContent className="h-48 overflow-auto font-mono text-sm">
        {state.log.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </CardContent>
    </Card>
  )
}