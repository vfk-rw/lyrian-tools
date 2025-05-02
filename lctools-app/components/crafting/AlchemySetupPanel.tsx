'use client'
/* eslint-disable react/no-unescaped-entities */

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card'
import { InfoIcon } from 'lucide-react'
import type { CraftingState } from '@/lib/crafting/types'

interface AlchemySetupPanelProps {
  state: CraftingState
  isStarted: boolean
  updateField: <K extends keyof CraftingState>(key: K, value: CraftingState[K]) => void
}

export function AlchemySetupPanel({ state, isStarted, updateField }: AlchemySetupPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alchemy Setup</CardTitle>
        <CardDescription>Configure your alchemical parameters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Target HP */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="target-hp">Target HP</Label>
            <HoverCard>
              <HoverCardTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <p>The target crafting HP you need to reach.</p>
              </HoverCardContent>
            </HoverCard>
          </div>
          <Input
            id="target-hp"
            type="number"
            min={1}
            value={state.craftingHP}
            onChange={e => updateField('craftingHP', Number(e.target.value))}
            disabled={isStarted}
            className="w-full"
          />
        </div>

        {/* Alchemist and Alchemeister Levels */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="alchemist-level">Alchemist Level (1-8)</Label>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <p>Your character's alchemist class level.</p>
              </HoverCardContent>
              </HoverCard>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                id="alchemist-level"
                min={1}
                max={8}
                step={1}
                value={[state.alchemistLevel]}
                onValueChange={([v]) => updateField('alchemistLevel', v)}
                disabled={isStarted}
                className="w-full"
              />
              <span className="w-8 text-center">{state.alchemistLevel}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="alchemeister-level">Alchemeister Level (0-8)</Label>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <p>Your character's alchemeister class level.</p>
              </HoverCardContent>
              </HoverCard>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                id="alchemeister-level"
                min={0}
                max={8}
                step={1}
                value={[state.alchemeisterLevel]}
                onValueChange={([v]) => updateField('alchemeisterLevel', v)}
                disabled={isStarted}
                className="w-full"
              />
              <span className="w-8 text-center">{state.alchemeisterLevel}</span>
            </div>
          </div>
        </div>

        {/* Item Type */}
        <div className="space-y-1.5">
          <Label>Item Type</Label>
          <RadioGroup
            value={state.itemType}
            onValueChange={v => updateField('itemType', v as CraftingState['itemType'])}
            className="grid grid-cols-4 gap-2"
          >
            {(['potion', 'flask', 'elixir', 'salve'] as const).map(type => (
              <div key={type} className="flex items-center gap-2">
                <RadioGroupItem
                  value={type}
                  id={`item-type-${type}`}
                  disabled={isStarted}
                />
                <Label htmlFor={`item-type-${type}`}>{type.charAt(0).toUpperCase() + type.slice(1)}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Effects Toggles */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="isHealing"
              checked={state.isHealing}
              onCheckedChange={v => updateField('isHealing', v)}
              disabled={isStarted}
            />
            <Label htmlFor="isHealing">Healing</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="isDamaging"
              checked={state.isDamaging}
              onCheckedChange={v => updateField('isDamaging', v)}
              disabled={isStarted}
            />
            <Label htmlFor="isDamaging">Damage</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="isAOE"
              checked={state.isAOE}
              onCheckedChange={v => updateField('isAOE', v)}
              disabled={isStarted}
            />
            <Label htmlFor="isAOE">AOE</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
