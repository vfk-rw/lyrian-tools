"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GatheringState, GatheringAction } from '@/lib/gathering/types'; // Actual import for state and action type
import { jsonGatheringActions } from '@/lib/gathering/data-loader'; // Actual import of actions
// Note: canUseAction and executeAction are part of the action object itself if created by action-interpreter

interface GatheringActionsPanelProps {
  state: GatheringState;
  setState: React.Dispatch<React.SetStateAction<GatheringState>>;
}

const GatheringActionsPanel: React.FC<GatheringActionsPanelProps> = ({ state, setState }) => {
  
  const isActionUsable = (action: GatheringAction): boolean => {
    if (!action) return false;
    // Check basic costs
    if (state.diceRemaining < action.diceCost) return false;
    if (state.currentNP < action.nodePointsCost) return false;
    if (state.currentLP < action.luckyPointsCost) return false;
    // Check if non-rapid action already used (this logic might be part of action.prerequisite in a full setup)
    if (!action.isRapid && state.usedActions.includes(action.id)) return false;
    // Check specific prerequisite function if it exists on the action object
    if (action.prerequisite && !action.prerequisite(state)) return false;
    
    return true;
  };

  const handleActionClick = (actionId: string) => {
    const action = jsonGatheringActions[actionId];
    if (action && isActionUsable(action)) {
      // The 'effect' function on the action object should return the new state
      if (typeof action.effect === 'function') {
        const newState = action.effect(state);
        setState(newState);
      } else {
        console.error(`Action ${actionId} does not have a valid effect function.`);
        // Fallback or error state update if needed
        // For now, just log and don't update state
      }
    }
  };

  const actionsToDisplay = jsonGatheringActions;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <TooltipProvider>
          {Object.values(actionsToDisplay).map((action: GatheringAction) => (
            <Tooltip key={action.id} delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start mb-2"
                  onClick={() => handleActionClick(action.id)}
                  disabled={!isActionUsable(action)}
                >
                  {action.name} ({action.costText})
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{action.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Dice: {action.diceCost}, NP: {action.nodePointsCost}, LP: {action.luckyPointsCost}
                  {action.isRapid ? ", Rapid" : ""}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
        {Object.keys(actionsToDisplay).length === 0 && (
            <p className="text-sm text-muted-foreground">No actions available or loaded.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default GatheringActionsPanel;
