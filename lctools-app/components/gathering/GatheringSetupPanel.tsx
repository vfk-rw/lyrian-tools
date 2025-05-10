"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { jsonNodeVariations } from "@/lib/gathering/data-loader";
import type { GatheringState } from "@/lib/gathering/types";

interface GatheringSetupPanelProps {
  setGatheringState: React.Dispatch<React.SetStateAction<GatheringState>>;
}

const GatheringSetupPanel: React.FC<GatheringSetupPanelProps> = ({ setGatheringState }) => {
  const [nodeType, setNodeType] = useState<GatheringState["nodeType"]>("ore");
  const [variation, setVariation] = useState<GatheringState["variations"][0]>("normal");
  const [nodeHP, setNodeHP] = useState<GatheringState["nodeHP"]>(3);
  const [nodePoints, setNodePoints] = useState<GatheringState["nodePoints"]>(40);
  const [luckyPoints, setLuckyPoints] = useState<GatheringState["luckyPoints"]>(15);
  const [gatheringSkill, setGatheringSkill] = useState<GatheringState["gatheringSkill"]>(5);
  const [expertise, setExpertise] = useState<GatheringState["expertise"]>(0);
  const [toolBonus, setToolBonus] = useState<GatheringState["toolBonus"]>(0);

  useEffect(() => {
    setGatheringState(prev => ({
      ...prev,
      nodeType,
      variations: [variation],
      nodeHP,
      nodePoints,
      luckyPoints,
      gatheringSkill,
      expertise,
      toolBonus
    }));
  }, [
    nodeType,
    variation,
    nodeHP,
    nodePoints,
    luckyPoints,
    gatheringSkill,
    expertise,
    toolBonus,
    setGatheringState
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup Gathering Session</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="nodeType">Node Type</Label>
            <Select value={nodeType} onValueChange={setNodeType}>
              <SelectTrigger id="nodeType"><SelectValue /></SelectTrigger>
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
            <Label htmlFor="variation">Node Variation</Label>
            <Select value={variation} onValueChange={setVariation}>
              <SelectTrigger id="variation"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(jsonNodeVariations).map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="nodeHP">Node HP</Label>
            <Input
              id="nodeHP"
              type="number"
              value={nodeHP}
              onChange={e => setNodeHP(Number(e.target.value))}
            />
          </div>

          <div>
            <Label htmlFor="nodePoints">Node Points (NP)</Label>
            <Input
              id="nodePoints"
              type="number"
              value={nodePoints}
              onChange={e => setNodePoints(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="luckyPoints">Lucky Points (LP)</Label>
            <Input
              id="luckyPoints"
              type="number"
              value={luckyPoints}
              onChange={e => setLuckyPoints(Number(e.target.value))}
            />
          </div>
            <div />
          <div>
            <Label htmlFor="gatheringSkill">Gathering Skill</Label>
            <Input
              id="gatheringSkill"
              type="number"
              value={gatheringSkill}
              onChange={e => setGatheringSkill(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="expertise">Expertise</Label>
            <Input
              id="expertise"
              type="number"
              value={expertise}
              onChange={e => setExpertise(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="toolBonus">Tool Bonus</Label>
            <Input
              id="toolBonus"
              type="number"
              value={toolBonus}
              onChange={e => setToolBonus(Number(e.target.value))}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GatheringSetupPanel;
