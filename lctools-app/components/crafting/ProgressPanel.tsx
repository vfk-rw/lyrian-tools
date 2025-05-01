'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import type { CraftingState } from '@/lib/crafting/types'

interface ProgressPanelProps {
  state: CraftingState
}

export function ProgressPanel({ state }: ProgressPanelProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Progress</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Crafting Points</Label>
          <Progress value={(state.craftingPoints / state.craftingHP) * 100} />
          <p>{state.craftingPoints} / {state.craftingHP}</p>
        </div>
        <div>
          <Label>Dice Remaining</Label>
          <Progress value={(state.diceRemaining / state.initialDice) * 100} />
          <p>{state.diceRemaining} dice left</p>
        </div>
        {state.bonuses.length > 0 && (
          <div>
            <Label>Bonuses:</Label>
            <p>{state.bonuses.join(', ')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}