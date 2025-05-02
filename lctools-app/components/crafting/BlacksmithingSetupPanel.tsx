'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card'
import { InfoIcon } from 'lucide-react'
import type { CraftingState, SpecialMaterial } from '@/lib/crafting/types'
import { Badge } from '@/components/ui/badge'

interface SetupPanelProps {
  state: CraftingState
  isStarted: boolean
  updateField: <K extends keyof CraftingState>(key: K, value: CraftingState[K]) => void
  baseMaterials: { [id: string]: { name: string; effectText: string; bonusDice: number } }
  specialMaterials: Record<string, SpecialMaterial>
  selectedAlloy: string
  onSelectAlloy: (id: string) => void
}

export function SetupPanel({ state, isStarted, updateField, baseMaterials, specialMaterials, selectedAlloy, onSelectAlloy }: SetupPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Craft Setup</CardTitle>
        <CardDescription>Configure your crafting parameters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Row 1: Base Material and Target HP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="base-material">Base Material</Label>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <p>Select the base material for your crafting project. Different materials provide different bonuses.</p>
                </HoverCardContent>
              </HoverCard>
            </div>
            <Select 
              value={state.baseMaterial} 
              onValueChange={v => updateField('baseMaterial', v)} 
              disabled={isStarted}
            >
              <SelectTrigger id="base-material">
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(baseMaterials).map(([id, m]) => (
                  <SelectItem key={id} value={id}>
                    <div className="flex flex-col">
                      <span>{m.name}</span>
                      <span className="text-xs text-muted-foreground">{m.effectText} (+{m.bonusDice} dice)</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="target-hp">Target HP</Label>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <p>The target crafting HP you need to reach with your crafting points.</p>
                </HoverCardContent>
              </HoverCard>
            </div>
            <Input 
              id="target-hp"
              type="number" 
              min={1} 
              max={99} 
              value={state.craftingHP} 
              onChange={e => updateField('craftingHP', Number(e.target.value))} 
              disabled={isStarted} 
              className="w-full"
            />
          </div>
        </div>

        {/* Row 2: Crafting Skill and Expertise fields side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="crafting-skill">Crafting Skill</Label>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <p>Your character&apos;s crafting skill level.</p>
                </HoverCardContent>
              </HoverCard>
            </div>
            <Input 
              id="crafting-skill"
              type="number" 
              min={0} 
              max={99} 
              value={state.craftingSkill} 
              onChange={e => updateField('craftingSkill', Number(e.target.value))} 
              disabled={isStarted}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="expertise">Expertise</Label>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <p>Your expertise bonus that gets added to most rolls.</p>
                </HoverCardContent>
              </HoverCard>
            </div>
            <Input 
              id="expertise"
              type="number" 
              min={0} 
              max={99} 
              value={state.expertise} 
              onChange={e => updateField('expertise', Number(e.target.value))} 
              disabled={isStarted}
              className="w-full"
            />
          </div>
        </div>

        {/* Row 3: Blacksmith and Forgemaster levels side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="blacksmith-level">Blacksmith Level (1-8)</Label>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <p>Your character&apos;s blacksmith class level. Unlocks special crafting actions.</p>
                </HoverCardContent>
              </HoverCard>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                id="blacksmith-level"
                min={1}
                max={8}
                step={1}
                value={[state.blacksmithLevel]}
                onValueChange={([value]) => updateField('blacksmithLevel', value)}
                disabled={isStarted}
                className="w-full"
              />
              <span className="w-8 text-center">{state.blacksmithLevel}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="forgemaster-level">Forgemaster Level (0-8)</Label>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <p>Your character&apos;s forgemaster class level. Unlocks additional crafting actions.</p>
                </HoverCardContent>
              </HoverCard>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                id="forgemaster-level"
                min={0}
                max={8}
                step={1}
                value={[state.forgemasterLevel]}
                onValueChange={([value]) => updateField('forgemasterLevel', value)}
                disabled={isStarted}
                className="w-full"
              />
              <span className="w-8 text-center">{state.forgemasterLevel}</span>
            </div>
          </div>
        </div>

        {/* Row 4: Weapon Alloy Selection */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="weapon-alloy">Weapon Alloy</Label>
            <HoverCard>
              <HoverCardTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <p>Select a special alloy to enhance your weapon. This alloy will be used throughout the crafting process.</p>
              </HoverCardContent>
            </HoverCard>
          </div>
          <Select 
            value={selectedAlloy} 
            onValueChange={onSelectAlloy} 
            disabled={isStarted}
          >
            <SelectTrigger id="weapon-alloy">
              <SelectValue placeholder="Select alloy (optional)" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(specialMaterials).map(([id, m]) => (
                <SelectItem key={id} value={id}>
                  <div className="flex flex-col">
                    <span>{m.name}</span>
                    <span className="text-xs text-muted-foreground">{m.effect}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedAlloy && (
            <div className="mt-2 bg-amber-50 p-2 rounded text-sm border border-amber-200">
              <p className="font-medium">{specialMaterials[selectedAlloy].name}</p>
              <p className="text-xs mt-1">{specialMaterials[selectedAlloy].effect}</p>
              {specialMaterials[selectedAlloy].special_effect && (
                <p className="text-xs mt-1 font-medium">{specialMaterials[selectedAlloy].special_effect}</p>
              )}
              <div className="flex gap-2 mt-2">
                {specialMaterials[selectedAlloy].dice_cost > 0 && (
                  <Badge variant="outline" className="bg-amber-100 border-amber-300">
                    {specialMaterials[selectedAlloy].dice_cost} dice cost
                  </Badge>
                )}
                {specialMaterials[selectedAlloy].point_cost > 0 && (
                  <Badge variant="outline" className="bg-amber-100 border-amber-300">
                    {specialMaterials[selectedAlloy].point_cost} point cost
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}