'use client'

import React, { useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DiamondIcon, DicesIcon, InfoIcon } from 'lucide-react'
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
  // Group the actions by their class requirements
  const groupedActions = useMemo(() => {
    const basic = actions.filter(a => a.className === null);
    const blacksmith = actions.filter(a => a.className === 'blacksmith');
    const forgemaster = actions.filter(a => a.className === 'forgemaster');
    return { basic, blacksmith, forgemaster };
  }, [actions]);

  // Get selected alloy info
  const selectedAlloyInfo = selectedAlloy ? 
    (jsonSpecialMaterials as Record<string, SpecialMaterial>)[selectedAlloy] : null;

  // Function to render action buttons with consistent styling
  const renderActionButton = (action: CraftingAction) => {
    const requiresPrereq = action.requiresPrerequisite && !action.prerequisite?.(state);
    const used = state.usedActions.includes(action.id);
    const notEnoughDice = isStarted && !isEnded && state.diceRemaining < action.diceCost;
    const notEnoughPoints = isStarted && !isEnded && state.craftingPoints < action.pointsCost;
    const buttonDisabled = requiresPrereq || (!action.isRapid && used) || !isStarted || isEnded || notEnoughDice || notEnoughPoints;
    
    // Choose a variant based on the button state
    let variant: "default" | "secondary" | "outline" | "destructive" | "ghost" = "default";
    let className = "";
    
    if (!isStarted || isEnded) {
      variant = "outline"; // Inactive session
    } else if (used && !action.isRapid) {
      variant = "ghost"; // Already used
      className = "opacity-50";
    } else if (requiresPrereq) {
      variant = "secondary"; // Missing prerequisites
      className = "bg-amber-100 text-amber-900 hover:bg-amber-200";
    } else if (notEnoughPoints) {
      variant = "destructive"; // Not enough crafting points
    } else if (notEnoughDice) {
      variant = "outline"; // Not enough dice
      className = "border-destructive text-destructive hover:bg-destructive/10";
    }
    
    return (
      <HoverCard key={action.id}>
        <HoverCardTrigger asChild>
          <Button
            variant={variant}
            className={`w-full justify-start ${className}`}
            onClick={() => onExecute(action)}
            disabled={buttonDisabled}
          >
            <div className="flex justify-between w-full items-center">
              <span>{action.name}</span>
              <div className="flex items-center gap-1">
                {action.diceCost > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1 ml-2">
                    <DicesIcon className="h-3 w-3" />
                    {action.diceCost}
                  </Badge>
                )}
                {action.pointsCost > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <DiamondIcon className="h-3 w-3" />
                    {action.pointsCost}
                  </Badge>
                )}
              </div>
            </div>
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-medium">{action.name}</h4>
            <p className="text-sm">{action.description}</p>
            
            <div className="flex flex-wrap gap-2 pt-2">
              {action.className && (
                <Badge variant="secondary">
                  {action.className} {action.classLevel}+
                </Badge>
              )}
              {action.diceCost > 0 && (
                <Badge>
                  <DicesIcon className="h-3 w-3 mr-1" /> {action.diceCost} dice
                </Badge>
              )}
              {action.pointsCost > 0 && (
                <Badge>
                  <DiamondIcon className="h-3 w-3 mr-1" /> {action.pointsCost} points
                </Badge>
              )}
              {action.isRapid && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  Rapid Action
                </Badge>
              )}
            </div>
            
            {requiresPrereq && (
              <div className="mt-2 text-sm bg-amber-50 p-2 rounded border border-amber-200 text-amber-800">
                You don&apos;t meet the prerequisites for this action.
              </div>
            )}
            {notEnoughDice && (
              <div className="mt-2 text-sm bg-red-50 p-2 rounded border border-red-200 text-red-800">
                Not enough dice remaining.
              </div>
            )}
            {notEnoughPoints && (
              <div className="mt-2 text-sm bg-red-50 p-2 rounded border border-red-200 text-red-800">
                Not enough crafting points.
              </div>
            )}
            {used && !action.isRapid && (
              <div className="mt-2 text-sm bg-gray-50 p-2 rounded border border-gray-200">
                This action has already been used.
              </div>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  // Special handling for weapon alloy
  const renderWeaponAlloyAction = () => {
    const alloyAction = actions.find(a => a.id === 'weapon-alloy');
    if (!alloyAction) return null;

    const requiresPrereq = alloyAction.requiresPrerequisite && !alloyAction.prerequisite?.(state);
    const used = state.usedActions.includes(alloyAction.id);
    const notEnoughDice = isStarted && !isEnded && state.diceRemaining < alloyAction.diceCost;
    const notEnoughPoints = isStarted && !isEnded && state.craftingPoints < alloyAction.pointsCost;
    const buttonDisabled = requiresPrereq || (!alloyAction.isRapid && used) || !isStarted || isEnded || notEnoughDice || notEnoughPoints || !selectedAlloy;
    
    let variant: "default" | "secondary" | "outline" | "destructive" | "ghost" = "default";
    let className = "";
    
    if (!isStarted || isEnded) {
      variant = "outline"; // Inactive session
    } else if (used && !alloyAction.isRapid) {
      variant = "ghost"; // Already used
      className = "opacity-50";
    } else if (requiresPrereq) {
      variant = "secondary"; // Missing prerequisites
    } else if (notEnoughPoints) {
      variant = "destructive"; // Not enough crafting points
    } else if (notEnoughDice) {
      variant = "outline"; // Not enough dice
      className = "border-destructive text-destructive";
    }

    return (
      <div className="space-y-2" key={alloyAction.id}>
        <h3 className="text-sm font-medium flex items-center gap-2">
          Special Alloys
          <HoverCard>
            <HoverCardTrigger asChild>
              <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <p className="text-sm">Apply special alloys to enhance your weapon with unique properties.</p>
            </HoverCardContent>
          </HoverCard>
        </h3>

        <div className="flex gap-2 flex-col sm:flex-row">
          <Select 
            value={selectedAlloy} 
            onValueChange={onSelectAlloy} 
            disabled={!isStarted || isEnded || used}
          >
            <SelectTrigger className="sm:w-[180px]">
              <SelectValue placeholder="Select alloy" />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(jsonSpecialMaterials) as [string, SpecialMaterial][]).map(([id, m]) => (
                <SelectItem key={id} value={id}>
                  <div className="flex flex-col">
                    <span>{m.name}</span>
                    <span className="text-xs text-muted-foreground">{m.effect}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={() => onExecute(alloyAction)} 
            disabled={buttonDisabled}
            variant={variant}
            className={className}
          >
            <div className="flex items-center gap-2">
              <span>Apply Alloy</span>
              {(alloyAction.diceCost > 0 || alloyAction.pointsCost > 0) && (
                <div className="flex items-center gap-1">
                  {alloyAction.diceCost > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <DicesIcon className="h-3 w-3" />
                      {alloyAction.diceCost}
                    </Badge>
                  )}
                  {alloyAction.pointsCost > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <DiamondIcon className="h-3 w-3" />
                      {alloyAction.pointsCost}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </Button>
        </div>
        
        {selectedAlloyInfo && (
          <div className="bg-amber-50 p-2 rounded text-sm border border-amber-200">
            <p className="font-medium">{selectedAlloyInfo.name}</p>
            <p className="text-xs mt-1">{selectedAlloyInfo.effect}</p>
            {selectedAlloyInfo.special_effect && (
              <p className="text-xs mt-1 font-medium">{selectedAlloyInfo.special_effect}</p>
            )}
            <div className="flex gap-2 mt-2">
              {selectedAlloyInfo.dice_cost > 0 && (
                <Badge variant="outline" className="bg-amber-100 border-amber-300">
                  <DicesIcon className="h-3 w-3 mr-1" /> {selectedAlloyInfo.dice_cost} dice
                </Badge>
              )}
              {selectedAlloyInfo.point_cost > 0 && (
                <Badge variant="outline" className="bg-amber-100 border-amber-300">
                  <DiamondIcon className="h-3 w-3 mr-1" /> {selectedAlloyInfo.point_cost}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Actions</CardTitle>
        <CardDescription>Available crafting actions</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="blacksmith">Blacksmith</TabsTrigger>
            <TabsTrigger value="forgemaster">Forgemaster</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            {groupedActions.basic.filter(a => a.id === 'weapon-alloy').length > 0 && renderWeaponAlloyAction()}
            
            {groupedActions.basic.filter(a => a.id !== 'weapon-alloy').length > 0 && (
              <>
                {renderWeaponAlloyAction() && <Separator className="my-4" />}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    Basic Actions
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <p className="text-sm">Basic crafting actions available to all characters.</p>
                      </HoverCardContent>
                    </HoverCard>
                  </h3>
                  <div className="grid gap-2">
                    {groupedActions.basic
                      .filter(a => a.id !== 'weapon-alloy')
                      .map(renderActionButton)}
                  </div>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="blacksmith" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                Blacksmith Actions
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <p className="text-sm">Special actions available to characters with Blacksmith levels.</p>
                  </HoverCardContent>
                </HoverCard>
              </h3>
              {groupedActions.blacksmith.length > 0 ? (
                <div className="grid gap-2">
                  {groupedActions.blacksmith.map(renderActionButton)}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No blacksmith actions available.</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="forgemaster" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                Forgemaster Actions
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <p className="text-sm">Special actions available to characters with Forgemaster levels.</p>
                  </HoverCardContent>
                </HoverCard>
              </h3>
              {groupedActions.forgemaster.length > 0 ? (
                <div className="grid gap-2">
                  {groupedActions.forgemaster.map(renderActionButton)}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No forgemaster actions available.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}