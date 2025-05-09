"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GatheringState, ResourceNode } from '@/lib/gathering/types'; // Actual import
import { createGatheringState } from '@/lib/gathering/state'; // Actual import
// import { jsonNodeVariations } from '@/lib/gathering/data-loader'; // Assuming this will be available for full variation list

// Placeholder for jsonNodeVariations until fully integrated or if only a subset is needed for UI
// TODO: Replace with actual import from data-loader once available and types are aligned
const jsonNodeVariations: Record<string, { id: string; name: string; description: string }> = {
    "normal": { id: "normal", name: "Normal Node", description: "No special modifiers." },
    "rich": { id: "rich", name: "Rich Node", description: "Yield and Rare Yield are doubled." },
    // Add other variations as needed for the UI from GATHERING_RULES.md
    "explosive": { id: "explosive", name: "Explosive Node", description: "If you do not complete the NP requirement, the rock explodes and you are inflicted by an injury." },
    "hazard": { id: "hazard", name: "Hazard Node", description: "Every mining action deals 1d4 damage to you." },
    "barren": { id: "barren", name: "Barren Node", description: "There is no Rare Yield for this node." },
    "obscured": { id: "obscured", name: "Obscured Node", description: "-1 Dice" },
    "muddy": { id: "muddy", name: "Muddy Node", description: "-1 Dice, all other gathering dice are upgraded to d20." },
    "arcane": { id: "arcane", name: "Arcane Node", description: "Abilities that grant LP now give NP, abilities that grant NP now grant LP." },
    "volatile": { id: "volatile", name: "Volatile Node", description: "Rolls 1-5 are now 1. Rolls 6-10 are now 10." },
    "deep": { id: "deep", name: "Deep Node", description: "The last HP of the outcrop grants rare yield for both NP and LP values. However all other HP has only normal materials for both NP and LP Values." },
    "hardened": { id: "hardened", name: "Hardened Node", description: "Tool bonuses are doubled." },
    "alloy": { id: "alloy", name: "Alloy Node", description: "This node has half normal yield, but grants two different rare yield materials." },
    "exposed": { id: "exposed", name: "Exposed Node", description: "+1 Dice" },
    "exposed_rich": { id: "exposed_rich", name: "Exposed Rich Node", description: "+1 Dice and Yield and Rare Yield are doubled." },
};


interface GatheringSetupPanelProps {
  setGatheringState: React.Dispatch<React.SetStateAction<GatheringState>>;
}

const GatheringSetupPanel: React.FC<GatheringSetupPanelProps> = ({ setGatheringState }) => {
  const [nodeName, setNodeName] = useState<string>("Generic Node");
  const [nodeType, setNodeType] = useState<string>("ore");
  const [nodeHP, setNodeHP] = useState<number>(3);
  const [nodePoints, setNodePoints] = useState<number>(40);
  const [luckyPoints, setLuckyPoints] = useState<number>(15);
  const [nodeYield, setNodeYield] = useState<number>(100);
  const [nodeYieldType, setNodeYieldType] = useState<string>("Generic Ore");
  const [nodeLuckyYield, setNodeLuckyYield] = useState<number>(10);
  const [nodeLuckyYieldType, setNodeLuckyYieldType] = useState<string>("Rare Gem");
  const [selectedVariations, setSelectedVariations] = useState<string[]>([]);

  const [gatheringSkill, setGatheringSkill] = useState<number>(5);
  const [expertise, setExpertise] = useState<number>(0);
  const [toolBonus, setToolBonus] = useState<number>(0);

  const handleStartGathering = () => {
    const node: ResourceNode = {
      name: nodeName,
      type: nodeType,
      hp: nodeHP,
      nodePoints: nodePoints,
      luckyPoints: luckyPoints,
      yield: nodeYield,
      yieldType: nodeYieldType,
      luckyYield: nodeLuckyYield,
      luckyYieldType: nodeLuckyYieldType,
      variations: selectedVariations,
    };
    const newState = createGatheringState(node, gatheringSkill, expertise, toolBonus);
    setGatheringState(newState);
  };

  const handleVariationChange = (value: string) => {
    if (value && value !== "none") {
      setSelectedVariations(prev =>
        prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
      );
    } else {
      setSelectedVariations([]); // Clear if "None" is selected
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup Gathering Session</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Resource Node Properties</h3>
            <div>
              <Label htmlFor="nodeName">Node Name</Label>
              <Input id="nodeName" type="text" value={nodeName} onChange={(e) => setNodeName(e.target.value)} placeholder="e.g., Iron Vein" />
            </div>
            <div>
              <Label htmlFor="nodeType">Node Type</Label>
              <Select value={nodeType} onValueChange={setNodeType}>
                <SelectTrigger id="nodeType">
                  <SelectValue placeholder="Select node type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ore">Ore</SelectItem>
                  <SelectItem value="herb">Herb</SelectItem>
                  <SelectItem value="wood">Wood</SelectItem>
                  <SelectItem value="fish">Fish</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="nodeHP">Node HP</Label>
              <Input id="nodeHP" type="number" value={nodeHP} onChange={(e) => setNodeHP(parseInt(e.target.value, 10))} min="0" />
            </div>
            <div>
              <Label htmlFor="nodePoints">Node Points (NP)</Label>
              <Input id="nodePoints" type="number" value={nodePoints} onChange={(e) => setNodePoints(parseInt(e.target.value, 10))} min="1" />
            </div>
            <div>
              <Label htmlFor="luckyPoints">Lucky Points (LP)</Label>
              <Input id="luckyPoints" type="number" value={luckyPoints} onChange={(e) => setLuckyPoints(parseInt(e.target.value, 10))} min="0" />
            </div>
            <div>
              <Label htmlFor="nodeYield">Normal Yield Amount</Label>
              <Input id="nodeYield" type="number" value={nodeYield} onChange={(e) => setNodeYield(parseInt(e.target.value, 10))} min="0" />
            </div>
            <div>
              <Label htmlFor="nodeYieldType">Normal Yield Type</Label>
              <Input id="nodeYieldType" type="text" value={nodeYieldType} onChange={(e) => setNodeYieldType(e.target.value)} placeholder="e.g., Iron Ore" />
            </div>
            <div>
              <Label htmlFor="nodeLuckyYield">Lucky Yield Amount</Label>
              <Input id="nodeLuckyYield" type="number" value={nodeLuckyYield} onChange={(e) => setNodeLuckyYield(parseInt(e.target.value, 10))} min="0" />
            </div>
            <div>
              <Label htmlFor="nodeLuckyYieldType">Lucky Yield Type</Label>
              <Input id="nodeLuckyYieldType" type="text" value={nodeLuckyYieldType} onChange={(e) => setNodeLuckyYieldType(e.target.value)} placeholder="e.g., Silver Ore" />
            </div>
            <div>
              <Label htmlFor="nodeVariations">Node Variations (Select multiple if applicable)</Label>
              {/* This is still a single select, a true multi-select component would be better */}
              <Select onValueChange={handleVariationChange} value={selectedVariations.length > 0 ? selectedVariations[0] : "none"} >
                <SelectTrigger id="nodeVariations">
                  <SelectValue placeholder="Select variations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {Object.values(jsonNodeVariations).map(variation => (
                    <SelectItem key={variation.id} value={variation.id}>
                      {variation.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Selected: {selectedVariations.join(', ') || 'None'}</p>
              {/* TODO: Implement a proper multi-select component for variations. */}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Gatherer Stats</h3>
            <div>
              <Label htmlFor="gatheringSkill">Gathering Skill</Label>
              <Input id="gatheringSkill" type="number" value={gatheringSkill} onChange={(e) => setGatheringSkill(parseInt(e.target.value, 10))} min="0" />
            </div>
            <div>
              <Label htmlFor="expertise">Expertise</Label>
              <Input id="expertise" type="number" value={expertise} onChange={(e) => setExpertise(parseInt(e.target.value, 10))} min="0" />
            </div>
            <div>
              <Label htmlFor="toolBonus">Tool Bonus</Label>
              <Input id="toolBonus" type="number" value={toolBonus} onChange={(e) => setToolBonus(parseInt(e.target.value, 10))} min="0" />
            </div>
          </div>
        </div>
        <Button onClick={handleStartGathering} className="w-full md:w-auto">
          Start Gathering Session
        </Button>
      </CardContent>
    </Card>
  );
};

export default GatheringSetupPanel;
