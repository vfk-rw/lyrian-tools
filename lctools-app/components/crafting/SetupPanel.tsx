'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CraftingState } from '@/lib/crafting/types'

interface SetupPanelProps {
  state: CraftingState
  isStarted: boolean
  updateField: <K extends keyof CraftingState>(key: K, value: CraftingState[K]) => void
  baseMaterials: { [id: string]: { name: string; effectText: string; bonusDice: number } }
}

export function SetupPanel({ state, isStarted, updateField, baseMaterials }: SetupPanelProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Craft Setup</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <Label>Base Material</Label>
          <Select value={state.baseMaterial} onValueChange={v => updateField('baseMaterial', v)} disabled={isStarted}>
            <SelectTrigger>
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(baseMaterials).map(([id, m]) => (
                <SelectItem key={id} value={id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Target HP</Label>
          <Input type="number" min={1} max={99} value={state.craftingHP} onChange={e => updateField('craftingHP', Number(e.target.value))} disabled={isStarted} />
        </div>
        <div>
          <Label>Crafting Skill</Label>
          <Input type="number" min={0} max={99} value={state.craftingSkill} onChange={e => updateField('craftingSkill', Number(e.target.value))} disabled={isStarted} />
        </div>
        <div>
          <Label>Expertise</Label>
          <Input type="number" min={0} max={99} value={state.expertise} onChange={e => updateField('expertise', Number(e.target.value))} disabled={isStarted} />
        </div>
        <div>
          <Label>Blacksmith Level</Label>
          <Input type="number" min={1} max={8} value={state.blacksmithLevel} onChange={e => updateField('blacksmithLevel', Number(e.target.value))} disabled={isStarted} />
        </div>
        <div>
          <Label>Forgemaster Level</Label>
          <Input type="number" min={0} max={8} value={state.forgemasterLevel} onChange={e => updateField('forgemasterLevel', Number(e.target.value))} disabled={isStarted} />
        </div>
      </CardContent>
    </Card>
  )
}