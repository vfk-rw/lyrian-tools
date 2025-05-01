'use client'

import React, { useState, useEffect } from 'react'
import { initialCraftingState } from '@/lib/crafting/state'
import { jsonBaseMaterials, jsonCraftingActions } from '@/lib/crafting/data-loader'
import type { CraftingState, CraftingAction } from '@/lib/crafting/types'
import { Button } from '@/components/ui/button'
import LCToolsSidebarClient from '@/components/lctools-sidebar-client'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { SetupPanel } from '@/components/crafting/SetupPanel'
import { ProgressPanel } from '@/components/crafting/ProgressPanel'
import { ActionsPanel } from '@/components/crafting/ActionsPanel'
import LogPanel from '@/components/crafting/LogPanel'

export default function BlacksmithingPage() {
  const [state, setState] = useState<CraftingState>({ ...initialCraftingState })
  const [selectedAlloy, setSelectedAlloy] = useState<string>('')
  const [isStarted, setIsStarted] = useState(false)
  const [isEnded, setIsEnded] = useState(false)

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
    setIsStarted(false)
    setIsEnded(false)
  }

  function updateField<K extends keyof CraftingState>(key: K, value: CraftingState[K]) {
    if (isStarted) return
    setState(prev => {
      const next = { ...prev, [key]: value }
      if (['baseMaterial','craftingHP','craftingSkill','expertise','blacksmithLevel','forgemasterLevel'].includes(key as string)) {
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

  useEffect(() => {
    if (isStarted && !isEnded && state.diceRemaining <= 0) {
      setState(prev => ({ ...prev, log: [...prev.log, 'Crafting ended.'] }))
      setIsEnded(true)
    }
  }, [state.diceRemaining, isStarted, isEnded])

  function startCraft() {
    if (!isStarted) {
      setIsStarted(true)
      setState(prev => ({ ...prev, log: [...prev.log, 'Crafting began.'] }))
    }
  }

  const actions = jsonCraftingActions
  const available = (Object.values(actions) as CraftingAction[]).filter(a => {
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
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="/crafting">Crafting</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Blacksmithing</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="p-4">
          <div className="flex gap-2 mb-4">
            <Button onClick={startCraft} disabled={isStarted}>Start Craft</Button>
            <Button variant="secondary" onClick={reset}>Reset Craft</Button>
          </div>
          <div className="grid gap-6">
            <SetupPanel
              state={state}
              isStarted={isStarted}
              updateField={updateField}
              baseMaterials={jsonBaseMaterials}
            />
            <div className="grid md:grid-cols-2 gap-4">
              <ProgressPanel state={state} />
              <ActionsPanel
                actions={available}
                state={state}
                selectedAlloy={selectedAlloy}
                onSelectAlloy={setSelectedAlloy}
                onExecute={execute}
                isStarted={isStarted}
                isEnded={isEnded}
              />
            </div>
            <LogPanel state={state} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}