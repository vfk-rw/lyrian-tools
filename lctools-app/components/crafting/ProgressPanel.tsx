'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'
import type { CraftingState } from '@/lib/crafting/types'

interface ProgressPanelProps {
  state: CraftingState
}

export function ProgressPanel({ state }: ProgressPanelProps) {
  // Calculate progress percentage
  const progressPercentage = Math.min((state.craftingPoints / state.craftingHP) * 100, 100);
  const dicePercentage = Math.max((state.diceRemaining / state.initialDice) * 100, 0);
  
  // Determine progress status and color
  const progressStatus = progressPercentage >= 100 
    ? 'Complete'
    : progressPercentage >= 75
    ? 'Almost there!'
    : progressPercentage >= 50
    ? 'Halfway there'
    : progressPercentage >= 25
    ? 'Getting started'
    : 'Just beginning';
  
  const progressColorClass = progressPercentage >= 100 
    ? 'bg-emerald-500' 
    : progressPercentage >= 75
    ? 'bg-lime-500'
    : progressPercentage >= 50
    ? 'bg-amber-500'
    : 'bg-blue-500';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress</CardTitle>
        <CardDescription>Track your crafting progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-sm font-medium">Crafting Points</Label>
            <span className="text-sm font-medium">{progressStatus}</span>
          </div>
          <div className="relative">
            <Progress 
              value={progressPercentage} 
              className={`h-3 rounded-md ${progressColorClass.replace('bg-', 'bg-primary/')}`}
            />
            {progressPercentage >= 100 && (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 absolute -top-0.5 right-0" />
            )}
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Current: {state.craftingPoints}</span>
            <span>Target: {state.craftingHP}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium">Dice Remaining</Label>
          <div className="relative">
            <Progress 
              value={dicePercentage} 
              className="h-3 rounded-md bg-indigo-500/20"
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{state.diceRemaining} of {state.initialDice} dice left</span>
            {state.diceRemaining === 0 && (
              <span className="text-destructive font-medium">No dice left!</span>
            )}
          </div>
        </div>
        
        {state.bonuses.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Active Bonuses</Label>
            <div className="flex flex-wrap gap-2">
              {state.bonuses.map((bonus, index) => (
                <Badge key={index} variant="secondary" className="bg-muted/50">
                  {bonus}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {state.alloys.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Applied Alloys</Label>
            <div className="flex flex-wrap gap-2">
              {state.alloys.map((alloy, index) => (
                <Badge key={index} variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200">
                  {alloy}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}