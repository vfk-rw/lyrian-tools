'use client'

import React, { useState, useEffect } from 'react'
import { initialCraftingState } from '@/lib/crafting/state'
import { jsonCraftingActions } from '@/lib/crafting/data-loader'
import type { CraftingState, CraftingAction } from '@/lib/crafting/types'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import LCToolsSidebarClient from '@/components/lctools-sidebar-client'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AlchemySetupPanel } from '@/components/crafting/AlchemySetupPanel'
import { ProgressPanel } from '@/components/crafting/ProgressPanel'
import { ActionsPanel } from '@/components/crafting/ActionsPanel'
import LogPanel from '@/components/crafting/LogPanel'
import { Beaker, PlayIcon, RefreshCcwIcon } from 'lucide-react'

export default function AlchemyPage() {
  const [state, setState] = useState<CraftingState>({ ...initialCraftingState })
  const [isStarted, setIsStarted] = useState(false)
  const [isEnded, setIsEnded] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  function reset() {
    setState(prev => ({
      ...prev,
      craftingPoints: 0,
      diceRemaining: prev.initialDice,
      usedActions: [],
      bonuses: [],
      materials: [],
      log: []
    }))
    setIsStarted(false)
    setIsEnded(false)
    setShowResetConfirm(false)
  }

  function updateField<K extends keyof CraftingState>(key: K, value: CraftingState[K]) {
    if (isStarted) return
    setState(prev => {
      const next = { ...prev, [key]: value }
      if (['craftingHP', 'alchemistLevel', 'alchemeisterLevel', 'itemType', 'isHealing', 'isDamaging', 'isAOE'].includes(key as string)) {
        next.diceRemaining = next.initialDice
        next.craftingPoints = 0
        next.usedActions = []
        next.bonuses = []
        next.materials = []
        next.log = []
        next.log.push('Crafting simulator initialized.')
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
    if (a.className === null) return true
    if (a.className === 'alchemist' || a.className === 'alchemeister') {
      const levelKey = a.className === 'alchemist' ? 'alchemistLevel' : 'alchemeisterLevel'
      const levelValue = state[levelKey as keyof CraftingState] as number
      return levelValue >= a.classLevel
    }
    return false
  })

  function execute(action: CraftingAction) {
    if (action.prerequisite && !action.prerequisite(state)) return
    const next = action.effect(state)
    setState(next)
  }

  const isSetupValid = state.craftingHP > 0

  return (
    <SidebarProvider>
      <LCToolsSidebarClient />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="/crafting">Crafting</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Alchemy</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center gap-2 px-4">
            <Beaker className="w-5 h-5 text-slate-500" />
            <span className="font-medium">Alchemy Simulator</span>
          </div>
        </header>

        <div className="p-6">
          <div className="flex gap-3 mb-6">
            <Button onClick={startCraft} disabled={isStarted || !isSetupValid} size="lg" className="gap-2">
              <PlayIcon className="h-4 w-4" />
              Start Craft
            </Button>
            <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="lg" className="gap-2">
                  <RefreshCcwIcon className="h-4 w-4" />
                  Reset Craft
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Crafting Session</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset your current progress. Your crafting setup will be preserved, but all progress and actions will be reset.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={reset}>Reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {!isSetupValid && !isStarted && (
              <p className="text-sm text-amber-500 flex items-center ml-2">
                Please complete the setup before starting crafting.
              </p>
            )}
          </div>

          <div className="grid gap-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <AlchemySetupPanel state={state} isStarted={isStarted} updateField={updateField} />
              <ProgressPanel state={state} />
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <ActionsPanel
                actions={available}
                state={state}
                selectedAlloy=""
                onSelectAlloy={() => {}}
                onExecute={execute}
                isStarted={isStarted}
                isEnded={isEnded}
              />
              <LogPanel state={state} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
