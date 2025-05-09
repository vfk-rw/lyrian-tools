"use client";

import React, { useState, useMemo } from "react";
import LCToolsSidebarClient from "@/components/lctools-sidebar-client";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

const armorMap = { none: 0, Light: 1, Medium: 2, Heavy: 3 };
const shieldMap = { none: 0, regular: 0, greatshield: 1 };
const armorDef = { none: 0, Light: 1, Medium: 2, Heavy: 3 };
const shieldDef = { none: 0, regular: 0, greatshield: 1 };
const armorActive = { none: 0, Light: 4, Medium: 8, Heavy: 12 };
const shieldActive = { none: 0, regular: 2, greatshield: 6 };

type StepperProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
};

function Stepper({ label, value, min, max, onChange }: StepperProps) {
  return (
    <div className="flex items-center gap-2 py-1">
      <button
        className="px-2 text-lg"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >−</button>
      <span className="w-16">{label}: {value}</span>
      <Slider
        value={[value]}
        min={min}
        max={max}
        onValueChange={([v]) => onChange(v)}
        className="flex-1 h-2"
      />
      <button
        className="px-2 text-lg"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >+</button>
    </div>
  );
}

export default function StatCalculatorPage() {
  const [focus, setFocus] = useState(4);
  const [power, setPower] = useState(4);
  const [agility, setAgility] = useState(4);
  const [toughness, setToughness] = useState(4);
  const [ap, setAp] = useState(4);
  const [movement, setMovement] = useState(20);
  const [armor, setArmor] = useState<keyof typeof armorMap>("none");
  const [shield, setShield] = useState<keyof typeof shieldMap>("none");

  const equipmentPenalty = armorMap[armor] + shieldMap[shield];
  const equipmentDefense = armorDef[armor] + shieldDef[shield];
  const activeDefense = armorActive[armor] + shieldActive[shield];

  const stats = useMemo(() => ({
    HP: 20 + toughness * 5,
    AP: ap,
    RP: 2 + (agility - equipmentPenalty),
    Mana: 6 + power,
    Initiative: `+${agility - equipmentPenalty}`,
    Focus: focus,
    Power: power,
    Agility: `${agility} (${agility - equipmentPenalty})`,
    Toughness: toughness,
    "Evasion/Dodge": `${7 + agility - equipmentPenalty} / ${15 + (agility - equipmentPenalty) * 2}`,
    "Guard/Block": `${equipmentDefense + Math.floor(toughness / 2)} / ${toughness + activeDefense}`,
    Movement: `${movement}ft`,
    "Save Bonus": toughness,
    "Light attack": `+${focus} Accuracy, 1d4+${power}`,
    "Heavy attack": `+${focus} Accuracy, 2d6+${power * 2}`,
  }), [focus, power, agility, toughness, ap, movement, equipmentPenalty, equipmentDefense, activeDefense]);

  const formulas: Record<string,string> = {
    HP: "20 + Toughness × 5",
    AP: "AP",
    RP: "2 + (Agility − Equipment Penalty)",
    Mana: "6 + Power",
    Initiative: "Agility − Equipment Penalty",
    Focus: "Focus",
    Power: "Power",
    Agility: "Agility",
    Toughness: "Toughness",
    Evasion: "7 + Agility − Equipment Penalty",
    Dodge: "15 + (Agility − Equipment Penalty) × 2",
    Guard: "Equipment Defense + ⌊Toughness/2⌋",
    Block: "Toughness + Active Defense",
    Movement: "Movement",
    "Save Bonus": "Toughness",
    "Light attack": "+Focus Accuracy, 1d4+Power",
    "Heavy attack": "+Focus Accuracy, 2d6+Power",
  };

  return (
    <SidebarProvider>
      <LCToolsSidebarClient />
      <SidebarInset className="space-y-4 p-2">
        <header className="flex h-12 items-center gap-2 px-2">
          <SidebarTrigger className="-ml-1" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href="/npc-tools">NPC Tools</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Stat Calculator</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex gap-4">
            <Card className="w-256">
            <CardHeader>
              <CardTitle className="text-sm">Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <Stepper label="Focus" value={focus} min={0} max={10} onChange={setFocus} />
              <Stepper label="Power" value={power} min={0} max={10} onChange={setPower} />
              <Stepper label="Agility" value={agility} min={0} max={10} onChange={setAgility} />
              <Stepper label="Toughness" value={toughness} min={0} max={10} onChange={setToughness} />
              <Stepper label="AP" value={ap} min={0} max={10} onChange={setAp} />
              <div className="flex items-center gap-2 py-1">
                <button className="px-2" onClick={() => setMovement(Math.max(0, movement - 1))}>−</button>
                <span className="w-24">Movement: {movement}</span>
                <Input
                  type="number"
                  min={0}
                  max={999}
                  value={movement}
                  onChange={e => setMovement(Math.min(999, Math.max(0, Number(e.target.value))))}
                  className="w-16"
                />
                <button className="px-2" onClick={() => setMovement(Math.min(999, movement + 1))}>+</button>
              </div>
              <div className="flex items-center gap-2 py-1">
                <span className="w-24">Armor:</span>
                <Select value={armor} onValueChange={(v: keyof typeof armorMap) => setArmor(v)}>
                  <SelectTrigger className="w-32"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(armorMap).map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 py-1">
                <span className="w-24">Shield:</span>
                <Select value={shield} onValueChange={(v: keyof typeof shieldMap) => setShield(v)}>
                  <SelectTrigger className="w-32"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(shieldMap).map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <table className="table-auto w-128 border-collapse text-sm mx-auto">
            <thead>
              <tr>
                <th className="border px-2 py-1">Stat</th>
                <th className="border px-2 py-1">Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats).map(([label, value]) => (
                <HoverCard key={label}>
                  <HoverCardTrigger asChild>
                    <tr className="border cursor-default">
                      <td className="border px-2 py-1">{label}</td>
                      <td className="border px-2 py-1">{value}</td>
                    </tr>
                  </HoverCardTrigger>
                  <HoverCardContent side="right" align="start">
                    <p className="text-xs">{formulas[label]}</p>
                  </HoverCardContent>
                </HoverCard>
              ))}
            </tbody>
          </table>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
