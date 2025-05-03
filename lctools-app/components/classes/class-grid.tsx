"use client"

import { ClassData } from "@/lib/classes/class-utils";
import { ClassCard } from "./class-card";
import { useState, useEffect, useCallback } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ClassGridProps {
  classes: ClassData[];
}

type SortOption = "name-asc" | "name-desc" | "tier-asc" | "tier-desc" | "difficulty-asc" | "difficulty-desc";

export function ClassGrid({ classes }: ClassGridProps) {
  const [sortOption, setSortOption] = useState<SortOption>("name-asc");
  const [sortedClasses, setSortedClasses] = useState<ClassData[]>(classes);
  
  // Sort classes whenever the sort option or input classes change
  const sortClasses = useCallback((option: SortOption, inputClasses: ClassData[]) => {
    const sorted = [...inputClasses];
    
    switch (option) {
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "tier-asc":
        sorted.sort((a, b) => a.tier - b.tier);
        break;
      case "tier-desc":
        sorted.sort((a, b) => b.tier - a.tier);
        break;
      case "difficulty-asc":
        sorted.sort((a, b) => a.difficulty - b.difficulty);
        break;
      case "difficulty-desc":
        sorted.sort((a, b) => b.difficulty - a.difficulty);
        break;
    }
    
    return sorted;
  }, []);
  
  // Update sorted classes when props or sort option changes
  useEffect(() => {
    setSortedClasses(sortClasses(sortOption, classes));
  }, [classes, sortOption, sortClasses]);
  
  // Change sort option and trigger re-sort
  const handleSortChange = (value: string) => {
    setSortOption(value as SortOption);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {classes.length} {classes.length === 1 ? "class" : "classes"} found
        </p>
        
        <div className="flex items-center gap-2">
          <Label htmlFor="sort-by" className="text-sm">
            Sort by:
          </Label>
          <Select value={sortOption} onValueChange={handleSortChange}>
            <SelectTrigger id="sort-by" className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="tier-asc">Tier (Low to High)</SelectItem>
              <SelectItem value="tier-desc">Tier (High to Low)</SelectItem>
              <SelectItem value="difficulty-asc">Difficulty (Easy to Hard)</SelectItem>
              <SelectItem value="difficulty-desc">Difficulty (Hard to Easy)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {sortedClasses.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
          <p className="text-center text-muted-foreground">
            No classes found matching your criteria.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {sortedClasses.map((classData) => (
            <ClassCard key={classData.id} classData={classData} />
          ))}
        </div>
      )}
    </div>
  );
}
