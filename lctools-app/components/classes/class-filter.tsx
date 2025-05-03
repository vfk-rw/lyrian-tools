"use client"

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { ClassSearchParams } from "@/lib/classes/class-utils";
import { useCallback, useState } from "react";

interface ClassFilterProps {
  roles: string[];
  onFilterChange: (filters: ClassSearchParams) => void;
}

export function ClassFilter({ roles, onFilterChange }: ClassFilterProps) {
  const [filters, setFilters] = useState<{
    search: string;
    tiers: number[];
    mainRole: string;
    secondaryRole: string;
    difficulties: number[];
  }>({
    search: "",
    tiers: [],
    mainRole: "any",
    secondaryRole: "any",
    difficulties: [],
  });
  
  // Use debounced callback to send filter changes to parent
  const applyFilters = useCallback(() => {
    const searchParams: ClassSearchParams = {};
    
    if (filters.search) {
      searchParams.search = filters.search;
    }
    
    if (filters.tiers.length > 0) {
      searchParams.tier = filters.tiers;
    }
    
    if (filters.mainRole && filters.mainRole !== "any") {
      searchParams.mainRole = filters.mainRole;
    }
    
    if (filters.secondaryRole && filters.secondaryRole !== "any") {
      searchParams.secondaryRole = filters.secondaryRole;
    }
    
    if (filters.difficulties.length > 0) {
      searchParams.difficulty = filters.difficulties;
    }
    
    onFilterChange(searchParams);
  }, [filters, onFilterChange]);
  
  // Update individual filter values
  const updateSearch = (value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, search: value };
      setTimeout(() => applyFilters(), 0); // Apply on next tick to avoid React 18 batching issues
      return newFilters;
    });
  };
  
  const updateTier = (tier: number, checked: boolean) => {
    setFilters(prev => {
      const newTiers = checked
        ? [...prev.tiers, tier]
        : prev.tiers.filter(t => t !== tier);
        
      const newFilters = { ...prev, tiers: newTiers };
      setTimeout(() => applyFilters(), 0);
      return newFilters;
    });
  };
  
  const updateMainRole = (value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, mainRole: value };
      setTimeout(() => applyFilters(), 0);
      return newFilters;
    });
  };
  
  const updateSecondaryRole = (value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, secondaryRole: value };
      setTimeout(() => applyFilters(), 0);
      return newFilters;
    });
  };
  
  const updateDifficulty = (difficulty: number, checked: boolean) => {
    setFilters(prev => {
      const newDifficulties = checked
        ? [...prev.difficulties, difficulty]
        : prev.difficulties.filter(d => d !== difficulty);
        
      const newFilters = { ...prev, difficulties: newDifficulties };
      setTimeout(() => applyFilters(), 0);
      return newFilters;
    });
  };
  
  const resetFilters = () => {
    setFilters({
      search: "",
      tiers: [],
      mainRole: "any",
      secondaryRole: "any",
      difficulties: [],
    });
    
    setTimeout(() => applyFilters(), 0);
  };
  
  return (
    <div className="space-y-4 rounded-lg border p-4 shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by name, ability, or description..."
            className="pl-8"
            value={filters.search}
            onChange={(e) => updateSearch(e.target.value)}
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1.5 h-7 w-7"
              onClick={() => updateSearch("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="space-y-2">
          <Label>Tier</Label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((tier) => (
              <div key={tier} className="flex items-center space-x-2">
                <Checkbox 
                  id={`tier-${tier}`} 
                  checked={filters.tiers.includes(tier)}
                  onCheckedChange={(checked) => updateTier(tier, checked === true)}
                />
                <Label htmlFor={`tier-${tier}`} className="cursor-pointer">
                  Tier {tier}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="main-role">Main Role</Label>
          <Select value={filters.mainRole} onValueChange={updateMainRole}>
            <SelectTrigger id="main-role">
              <SelectValue placeholder="Any role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any role</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="secondary-role">Secondary Role</Label>
          <Select value={filters.secondaryRole} onValueChange={updateSecondaryRole}>
            <SelectTrigger id="secondary-role">
              <SelectValue placeholder="Any role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any role</SelectItem>
              <SelectItem value="None">None</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Difficulty</Label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((difficulty) => (
              <div key={difficulty} className="flex items-center space-x-2">
                <Checkbox 
                  id={`difficulty-${difficulty}`} 
                  checked={filters.difficulties.includes(difficulty)}
                  onCheckedChange={(checked) => updateDifficulty(difficulty, checked === true)}
                />
                <Label htmlFor={`difficulty-${difficulty}`} className="cursor-pointer">
                  {difficulty}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetFilters}
          className="text-xs"
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
