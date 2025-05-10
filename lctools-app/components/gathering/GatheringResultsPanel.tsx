"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GatheringState } from '@/lib/gathering/types'; // Actual import
import { initialGatheringState } from '@/lib/gathering/state'; // Actual imports

interface GatheringResultsPanelProps {
  state: GatheringState;
  setState: React.Dispatch<React.SetStateAction<GatheringState>>;
  isStarted: boolean;
  isEnded: boolean;
}

const GatheringResultsPanel: React.FC<GatheringResultsPanelProps> = ({ state, setState, isStarted, isEnded }) => {
  const { 
    success, 
    luckySuccess, 
    normalYield, 
    yieldType, 
    luckyYield, 
    luckyYieldType,
    diceRemaining,
    nodeHP
  } = state;

  // Only show results after session has started and ended
  if (!isStarted || !isEnded) {
    return null;
  }


  const handleResetSession = () => {
    // If node still has HP and wasn't successful, allow gathering again from the same node state (partially depleted)
    // Otherwise, reset to a completely new initial state.
    // For simplicity now, always reset to the global initialGatheringState.
    // A more advanced reset would re-initialize based on the original node config if nodeHP > 0.
    if (nodeHP && nodeHP > 0 && !success) {
        // To gather again from the same node, we might want to reset dice, usedActions, currentNP/LP, but keep nodeHP and original node yields.
        // This requires a more nuanced reset function than just initialGatheringState.
        // For now, we'll just use initialGatheringState for simplicity, which implies a new node.
        // A better approach would be to have a `createGatheringStateForNextAttempt(currentNodeState)`
        setState(initialGatheringState); 
    } else {
        setState(initialGatheringState);
    }
  };

  // Once ended, show results.
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Gathering Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {success ? (
          <>
            <p className="text-green-600 font-semibold">Gathering Successful!</p>
            <p>You obtained: {normalYield ?? 0} {yieldType || "items"}.</p>
            {luckySuccess && (
              <p>Lucky find! You also obtained: {luckyYield ?? 0} {luckyYieldType || "rare items"}.</p>
            )}
          </>
        ) : (
          <p className="text-red-600 font-semibold">Gathering Failed or Ended.</p>
        )}
        <p className="text-sm text-muted-foreground">Node HP remaining: {nodeHP ?? 'N/A'}</p>
        <p className="text-sm text-muted-foreground">Dice remaining: {diceRemaining ?? 'N/A'}</p>
        <Button onClick={handleResetSession} className="w-full md:w-auto mt-4">
          {nodeHP && nodeHP > 0 && !success ? "Try Again on Node" : "Start New Session"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GatheringResultsPanel;
