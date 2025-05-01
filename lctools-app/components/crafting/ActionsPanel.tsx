'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import type { CraftingState, CraftingAction, SpecialMaterial } from '@/lib/crafting/types'
import { jsonSpecialMaterials } from '@/lib/crafting/data-loader'

interface ActionsPanelProps {
  actions: CraftingAction[]
  state: CraftingState
  selectedAlloy: string
  onSelectAlloy: (id: string) => void
  onExecute: (action: CraftingAction) => void
  isStarted: boolean
  isEnded: boolean
}

export function ActionsPanel({ actions, state, selectedAlloy, onSelectAlloy, onExecute, isStarted, isEnded }: ActionsPanelProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
      <CardContent className="flex-1 grid gap-2">
        {actions.map(a => {
          const disabled = a.requiresPrerequisite && !a.prerequisite?.(state)
          const used = state.usedActions.includes(a.id)
          const buttonDisabled = disabled || (!a.isRapid && used) || !isStarted || isEnded || state.diceRemaining < a.diceCost || state.craftingPoints < a.pointsCost

          if (a.id === 'weapon-alloy') {
            return (
              <div key={a.id} className="flex gap-2">
                <Select value={selectedAlloy} onValueChange={onSelectAlloy} disabled={!isStarted || isEnded}>
                  <SelectTrigger><SelectValue placeholder="Select alloy" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(jsonSpecialMaterials) as [string, SpecialMaterial][]).map(([id, m]) => (
                      <SelectItem key={id} value={id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => onExecute(a)} disabled={!selectedAlloy || buttonDisabled}>{a.name}</Button>
              </div>
            )
          }
          return (
            <Button key={a.id} onClick={() => onExecute(a)} disabled={buttonDisabled}>
              {a.name}
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}