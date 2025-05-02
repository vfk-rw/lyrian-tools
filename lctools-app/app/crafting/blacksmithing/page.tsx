'use client'

import React, { useState, useEffect } from 'react'
import { initialCraftingState } from '@/lib/crafting/state'
import { jsonBaseMaterials, jsonCraftingActions, jsonSpecialMaterials } from '@/lib/crafting/data-loader'
import type { CraftingState, CraftingAction } from '@/lib/crafting/types'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import LCToolsSidebarClient from '@/components/lctools-sidebar-client'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { SetupPanel } from '@/components/crafting/SetupPanel'
import { ProgressPanel } from '@/components/crafting/ProgressPanel'
import { ActionsPanel } from '@/components/crafting/ActionsPanel'
import LogPanel from '@/components/crafting/LogPanel'
import { Anvil, PlayIcon, RefreshCcwIcon } from 'lucide-react'

export default function BlacksmithingPage() {
  const [state, setState] = useState<CraftingState>({ ...initialCraftingState })
  const [selectedAlloy, setSelectedAlloy] = useState<string>('')
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
      alloys: [],
      log: [],
    }))
    setIsStarted(false)
    setIsEnded(false)
    setShowResetConfirm(false)
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
      setState(prev => ({ 
        ...prev, 
        log: [...prev.log, 'Crafting began.']
      }))

      // If an alloy is selected, add a log message
      if (selectedAlloy) {
        const alloyName = jsonSpecialMaterials[selectedAlloy]?.name || 'Unknown';
        setState(prev => ({ 
          ...prev, 
          log: [...prev.log, `Crafting with ${alloyName} alloy.`]
        }));
      }
    }
  }

  const actions = jsonCraftingActions
  const available = (Object.values(actions) as CraftingAction[]).filter(a => {
    if (a.className === null) return true
    if (a.className === 'blacksmith' || a.className === 'forgemaster') {
      const levelKey = a.className === 'blacksmith' ? 'blacksmithLevel' : 'forgemasterLevel'
      const levelValue = state[levelKey as keyof CraftingState] as number
      return levelValue >= a.classLevel
    }
    return false
  })
  
  function execute(action: CraftingAction) {
    if (action.prerequisite && !action.prerequisite(state)) return
    const next = action.id === 'weapon-alloy'
      ? action.effect(state, selectedAlloy)
      : action.effect(state)
    setState(() => next)
  }

  // Calculate if setup is complete and valid
  const isSetupValid = state.baseMaterial && state.craftingHP > 0

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
                <BreadcrumbItem><BreadcrumbPage>Blacksmithing</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center gap-2 px-4">
            <Anvil className="w-5 h-5 text-slate-500" />
            <span className="font-medium">Blacksmithing Simulator</span>
          </div>
        </header>
        
        <div className="p-6">
          <div className="flex gap-3 mb-6">
            <Button 
              onClick={startCraft} 
              disabled={isStarted || !isSetupValid} 
              className="gap-2"
              size="lg"
            >
              <PlayIcon className="h-4 w-4" />
              Start Craft
            </Button>
            
            <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  size="lg"
                >
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
            {/* Row 1: Setup and Progress side by side */}
            <div className="grid lg:grid-cols-2 gap-6">
              <SetupPanel
                state={state}
                isStarted={isStarted}
                updateField={updateField}
                baseMaterials={jsonBaseMaterials}
                specialMaterials={jsonSpecialMaterials}
                selectedAlloy={selectedAlloy}
                onSelectAlloy={setSelectedAlloy}
              />
              <ProgressPanel state={state} />
            </div>
            
            {/* Row 2: Actions and Log side by side */}
            <div className="grid lg:grid-cols-2 gap-6">
              <ActionsPanel
                actions={available}
                state={state}
                selectedAlloy={selectedAlloy}
                onSelectAlloy={setSelectedAlloy}
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