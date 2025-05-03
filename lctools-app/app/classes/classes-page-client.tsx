"use client"

import { useState } from "react";
import { ClassData, ClassSearchParams, searchClasses } from "@/lib/classes/class-utils";
import { ClassFilter } from "@/components/classes/class-filter";
import { ClassGrid } from "@/components/classes/class-grid";

interface ClassesPageClientProps {
  initialClasses: ClassData[];
  roles: string[];
}

export function ClassesPageClient({ initialClasses, roles }: ClassesPageClientProps) {
  const [filteredClasses, setFilteredClasses] = useState<ClassData[]>(initialClasses);
  
  const handleFilterChange = (filters: ClassSearchParams) => {
    const results = searchClasses(initialClasses, filters);
    setFilteredClasses(results);
  };
  
  return (
    <div className="space-y-6">
      <ClassFilter roles={roles} onFilterChange={handleFilterChange} />
      <ClassGrid classes={filteredClasses} />
    </div>
  );
}
