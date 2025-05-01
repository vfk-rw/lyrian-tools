'use client'

import React, { useState } from 'react'
import { jsonBaseMaterials, jsonSpecialMaterials, jsonCraftingActions } from '@/lib/crafting/data-loader'
import type { CraftingState, CraftingAction } from '@/lib/crafting/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import LCToolsSidebarClient from "@/components/lctools-sidebar-client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default function BlacksmithingPage() {
  // build initial state from defaults
  const [state, setState] = useState<CraftingState>({
    itemValue: 1,
    craftingHP: 1,
    baseMaterial: Object.keys(jsonBaseMaterials)[0],
    craftingSkill: 0,
    expertise: 0,
    blacksmithLevel: 1,
    forgemasterLevel: 0,
    diceRemaining: 5,
    craftingPoints: 0,
    usedActions: [],
    bonuses: [],
    materials: [],
    alloys: [],
    log: [],
    initialDice: 5,
  })
  const [selectedAlloy, setSelectedAlloy] = useState<string>('')

  function reset() {
    setState(prev => ({
      ...prev,
      craftingPoints: 0,
      diceRemaining: prev.initialDice,
      usedActions: [],
      bonuses: [],
      alloys: [],
      log: [],
    }))
  }

  function updateField<K extends keyof CraftingState>(key: K, value: CraftingState[K]) {
    setState(prev => {
      const next = { ...prev, [key]: value }
      if (['baseMaterial','craftingHP','craftingSkill','expertise','blacksmithLevel','forgemasterLevel'].includes(key)) {
        // recalc initial dice based on base material bonus
        next.initialDice = 5 + (jsonBaseMaterials[next.baseMaterial]?.bonusDice || 0)
        next.diceRemaining = next.initialDice
        next.craftingPoints = 0
        next.usedActions = []
        next.bonuses = []
        next.alloys = []
        next.log = []
      }
      return next
    })
  }

  const actions = jsonCraftingActions
  const available = (Object.values(actions) as CraftingAction[]).filter((a: CraftingAction) => {
    // filter by class level
    if (a.className === 'blacksmith' && state.blacksmithLevel < a.classLevel) return false
    if (a.className === 'forgemaster' && state.forgemasterLevel < a.classLevel) return false
    return true
  })

  function execute(action: CraftingAction) {
    if (action.prerequisite && !action.prerequisite(state)) return
    const next = action.id === 'weapon-alloy'
      ? action.effect(state, selectedAlloy)
      : action.effect(state)
    setState(() => next)
  }

  return (
    <SidebarProvider>
      <LCToolsSidebarClient />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/crafting">Crafting</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Blacksmithing</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="p-4 grid gap-6">
            <Card>
              <CardHeader><CardTitle>Craft Setup</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Base Material</Label>
                  <Select value={state.baseMaterial} onValueChange={v => updateField('baseMaterial', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(jsonBaseMaterials).map(([id, m]) => (<SelectItem key={id} value={id}>{m.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target HP</Label>
                  <Input type="number" min={1} max={99} value={state.craftingHP} onChange={e => updateField('craftingHP', Number(e.target.value))} />
                </div>
                <div>
                  <Label>Crafting Skill</Label>
                  <Input type="number" min={0} max={99} value={state.craftingSkill} onChange={e => updateField('craftingSkill', Number(e.target.value))} />
                </div>
                <div>
                  <Label>Expertise</Label>
                  <Input type="number" min={0} max={99} value={state.expertise} onChange={e => updateField('expertise', Number(e.target.value))} />
                </div>
                <div>
                  <Label>Blacksmith Level</Label>
                  <Input type="number" min={1} max={8} value={state.blacksmithLevel} onChange={e => updateField('blacksmithLevel', Number(e.target.value))} />
                </div>
                <div>
                  <Label>Forgemaster Level</Label>
                  <Input type="number" min={0} max={8} value={state.forgemasterLevel} onChange={e => updateField('forgemasterLevel', Number(e.target.value))} />
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle>Progress</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Crafting Points</Label>
                    <Progress value={(state.craftingPoints/state.craftingHP)*100} />
                    <p>{state.craftingPoints} / {state.craftingHP}</p>
                  </div>
                  <div>
                    <Label>Dice Remaining</Label>
                    <Progress value={(state.diceRemaining/state.initialDice)*100} />
                    <p>{state.diceRemaining} dice left</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="flex flex-col">
                <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                <CardContent className="flex-1 grid gap-2">
                  {available.map(a => {
                    const disabled = a.requiresPrerequisite && !a.prerequisite?.(state)
                    if (a.id === 'weapon-alloy') return (
                      <div key={a.id} className="flex gap-2">
                        <Select value={selectedAlloy} onValueChange={setSelectedAlloy}>
                          <SelectTrigger><SelectValue placeholder="Select alloy" /></SelectTrigger>
                          <SelectContent>
                            {(Object.entries(jsonSpecialMaterials) as [string, { name: string }][]).map(([id, m]) => (
                              <SelectItem key={id} value={id}>{m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={() => execute(a)} disabled={disabled || !selectedAlloy}>{a.name}</Button>
                      </div>
                    )
                    return (
                      <Button
                        key={a.id}
                        onClick={() => execute(a)}
                        disabled={disabled || (state.usedActions.includes(a.id) && !a.isRapid)}
                      >
                        {a.name}
                      </Button>
                    )
                  })}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Log</CardTitle></CardHeader>
              <CardContent className="h-48 overflow-auto font-mono text-sm">
                {state.log.map((line, i) => <p key={i}>{line}</p>)}
              </CardContent>
            </Card>

            <Button variant="secondary" onClick={reset}>Reset Craft</Button>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}