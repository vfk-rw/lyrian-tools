"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GatheringState } from '@/lib/gathering/types'; // Actual import

interface GatheringStatusPanelProps {
  state: GatheringState;
}

const GatheringStatusPanel: React.FC<GatheringStatusPanelProps> = ({ state }) => {
  const { 
    nodeHP, 
    currentNP, 
    nodePoints,
    currentLP, 
    luckyPoints,
    diceRemaining,
    bonuses = [] // Default to empty array if bonuses is undefined
  } = state;

  // Ensure nodePoints and luckyPoints are not zero to avoid division by zero
  // and provide default values if they are undefined from the state.
  const safeNodePoints = nodePoints ?? 1;
  const safeLuckyPoints = luckyPoints ?? 1;
  const safeCurrentNP = currentNP ?? 0;
  const safeCurrentLP = currentLP ?? 0;


  const npProgress = safeNodePoints > 0 ? (safeCurrentNP / safeNodePoints) * 100 : 0;
  const lpProgress = safeLuckyPoints > 0 ? (safeCurrentLP / safeLuckyPoints) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gathering Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">Node HP: {nodeHP ?? 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm font-medium">
            Node Points (NP): {safeCurrentNP} / {safeNodePoints}
          </p>
          <Progress value={npProgress} className="w-full h-2 mt-1" />
        </div>
        <div>
          <p className="text-sm font-medium">
            Lucky Points (LP): {safeCurrentLP} / {safeLuckyPoints}
          </p>
          <Progress value={lpProgress} className="w-full h-2 mt-1" />
        </div>
        <div>
          <p className="text-sm font-medium">Dice Remaining: {diceRemaining ?? 'N/A'}</p>
        </div>
        {state.storedRoll !== undefined && (
          <div>
            <p className="text-sm font-medium">Stored Roll: {state.storedRoll}</p>
          </div>
        )}
        {bonuses && bonuses.length > 0 && (
          <div>
            <p className="text-sm font-medium">Active Bonuses:</p>
            <ul className="list-disc list-inside text-sm">
              {bonuses.map((bonus, index) => (
                <li key={index}>{bonus}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GatheringStatusPanel;
