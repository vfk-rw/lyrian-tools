'use client'

import React, { useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card'
import { Badge } from '@/components/ui/badge'
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

export function ActionsPanel({ actions, state, selectedAlloy, onExecute, isStarted, isEnded }: ActionsPanelProps) {
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
                  <Badge variant="outline" className="flex items-center gap-1 ml-2 bg-white/90 text-black border-slate-400">
                    <DicesIcon className="h-3 w-3 text-black" />
                    {action.diceCost}
                  </Badge>
                )}
                {action.pointsCost > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-white/90 text-black border-slate-400">
                    <DiamondIcon className="h-3 w-3 text-black" />
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
    
    // Don't display the action if no alloy was selected
    if (!selectedAlloy) return null;

    // Get the selected alloy's costs
    const diceCost = selectedAlloyInfo ? selectedAlloyInfo.dice_cost : alloyAction.diceCost;
    const pointCost = selectedAlloyInfo ? selectedAlloyInfo.point_cost : alloyAction.pointsCost;

    const requiresPrereq = alloyAction.requiresPrerequisite && !alloyAction.prerequisite?.(state);
    const used = state.usedActions.includes(alloyAction.id);
    const notEnoughDice = isStarted && !isEnded && state.diceRemaining < diceCost;
    const notEnoughPoints = isStarted && !isEnded && state.craftingPoints < pointCost;
    const buttonDisabled = requiresPrereq || (!alloyAction.isRapid && used) || !isStarted || isEnded || notEnoughDice || notEnoughPoints;
    
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
          Apply Selected Alloy
          <HoverCard>
            <HoverCardTrigger asChild>
              <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <p className="text-sm">Apply the selected {selectedAlloyInfo?.name} alloy to enhance your weapon.</p>
            </HoverCardContent>
          </HoverCard>
        </h3>

        <div className="flex gap-2 flex-col sm:flex-row">
          <Button 
            onClick={() => onExecute(alloyAction)} 
            disabled={buttonDisabled}
            variant={variant}
            className={`${className} w-full`}
          >
            <div className="flex items-center gap-2">
              <span>Apply {selectedAlloyInfo?.name} Alloy</span>
              <div className="flex items-center gap-1">
                {diceCost > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-white/90 text-black border-slate-400">
                    <DicesIcon className="h-3 w-3 text-black" />
                    {diceCost}
                  </Badge>
                )}
                {pointCost > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-white/90 text-black border-slate-400">
                    <DiamondIcon className="h-3 w-3 text-black" />
                    {pointCost}
                  </Badge>
                )}
              </div>
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
        {/* Special Alloys Section */}
        {groupedActions.basic.filter(a => a.id === 'weapon-alloy').length > 0 && renderWeaponAlloyAction()}
        
        {/* Basic Actions Section */}
        <div className="space-y-2 mt-4">
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
        
        {/* Blacksmith Actions Section */}
        {groupedActions.blacksmith.length > 0 && (
          <div className="space-y-2 mt-6">
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
            <div className="grid gap-2">
              {groupedActions.blacksmith.map(renderActionButton)}
            </div>
          </div>
        )}
        
        {/* Forgemaster Actions Section */}
        {groupedActions.forgemaster.length > 0 && (
          <div className="space-y-2 mt-6">
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
            <div className="grid gap-2">
              {groupedActions.forgemaster.map(renderActionButton)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}