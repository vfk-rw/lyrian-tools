"use client"

import { useState } from "react";
import { ClassAbility } from "@/lib/classes/class-utils";
import { AbilitySearchParams, searchAbilities } from "@/lib/classes/ability-utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AbilitySearchClientProps {
  initialAbilities: { ability: ClassAbility; className: string; classId: string }[];
  keywords: string[];
  ranges: string[];
}

export function AbilitySearchClient({ 
  initialAbilities, 
  keywords,
  ranges
}: AbilitySearchClientProps) {
  const [searchParams, setSearchParams] = useState<AbilitySearchParams>({});
  const [filteredAbilities, setFilteredAbilities] = useState<{ ability: ClassAbility; className: string; classId: string }[]>(initialAbilities);
  const [expandedAbility, setExpandedAbility] = useState<string | null>(null);

  // Handle search text change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newParams = {
      ...searchParams,
      search: e.target.value
    };
    
    setSearchParams(newParams);
    setFilteredAbilities(searchAbilities(initialAbilities, newParams));
  };

  // Handle keyword filter change
  const handleKeywordChange = (value: string) => {
    const newParams = {
      ...searchParams,
      keyword: value === "all" ? undefined : value
    };
    
    setSearchParams(newParams);
    setFilteredAbilities(searchAbilities(initialAbilities, newParams));
  };

  // Handle range filter change
  const handleRangeChange = (value: string) => {
    const newParams = {
      ...searchParams,
      range: value === "all" ? undefined : value
    };
    
    setSearchParams(newParams);
    setFilteredAbilities(searchAbilities(initialAbilities, newParams));
  };

  // Handle cost filter changes
  const handleCostFilterChange = (key: 'hasMana' | 'hasRP' | 'hasAP', checked: boolean) => {
    const newParams = {
      ...searchParams,
      [key]: checked || undefined
    };
    
    setSearchParams(newParams);
    setFilteredAbilities(searchAbilities(initialAbilities, newParams));
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchParams({});
    setFilteredAbilities(initialAbilities);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter Abilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search box */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input 
                id="search" 
                placeholder="Search ability names, descriptions, keywords..." 
                value={searchParams.search || ''}
                onChange={handleSearchChange}
              />
            </div>

            {/* Filters grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Keyword filter */}
              <div className="space-y-2">
                <Label htmlFor="keyword-filter">Keyword</Label>
                <Select 
                  onValueChange={handleKeywordChange} 
                  value={searchParams.keyword?.toString() || 'all'}
                >
                  <SelectTrigger id="keyword-filter">
                    <SelectValue placeholder="All Keywords" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Keywords</SelectItem>
                    {keywords.map(keyword => (
                      <SelectItem key={keyword} value={keyword}>{keyword}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Range filter */}
              <div className="space-y-2">
                <Label htmlFor="range-filter">Range</Label>
                <Select 
                  onValueChange={handleRangeChange} 
                  value={searchParams.range?.toString() || 'all'}
                >
                  <SelectTrigger id="range-filter">
                    <SelectValue placeholder="All Ranges" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ranges</SelectItem>
                    {ranges.map(range => (
                      <SelectItem key={range} value={range}>{range}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cost filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="mana-filter" 
                  checked={searchParams.hasMana || false}
                  onCheckedChange={(checked) => 
                    handleCostFilterChange('hasMana', checked as boolean)
                  }
                />
                <Label htmlFor="mana-filter">Has Mana Cost</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="rp-filter" 
                  checked={searchParams.hasRP || false}
                  onCheckedChange={(checked) => 
                    handleCostFilterChange('hasRP', checked as boolean)
                  }
                />
                <Label htmlFor="rp-filter">Has RP Cost</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="ap-filter" 
                  checked={searchParams.hasAP || false}
                  onCheckedChange={(checked) => 
                    handleCostFilterChange('hasAP', checked as boolean)
                  }
                />
                <Label htmlFor="ap-filter">Has AP Cost</Label>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex justify-between w-full">
            <div>
              <span className="text-sm text-muted-foreground">
                Found {filteredAbilities.length} abilities
              </span>
            </div>
            <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
          </div>
        </CardFooter>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Abilities</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Keywords</TableHead>
                <TableHead>Range</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Costs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAbilities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No abilities found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAbilities.map(({ ability, className, classId }) => (
                  <TableRow 
                    key={`${classId}-${ability.id}`}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setExpandedAbility(expandedAbility === `${classId}-${ability.id}` ? null : `${classId}-${ability.id}`)}
                  >
                    <TableCell className="font-medium">{ability.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {ability.keywords?.map(keyword => (
                          <Badge key={`${classId}-${ability.id}-${keyword}`} variant="outline">{keyword}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{ability.range}</TableCell>
                    <TableCell>{className}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {ability.costs?.mana && <Badge>Mana: {ability.costs.mana}</Badge>}
                        {ability.costs?.rp && <Badge>RP: {ability.costs.rp}</Badge>}
                        {ability.costs?.ap && <Badge>AP: {ability.costs.ap}</Badge>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Expanded abilities */}
      {filteredAbilities.map(({ ability, className, classId }) => {
        const uniqueKey = `${classId}-${ability.id}`;
        if (uniqueKey === expandedAbility) {
          return (
            <Card key={uniqueKey} className="border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{ability.name}</CardTitle>
                  <Button variant="outline" onClick={() => setExpandedAbility(null)}>Close</Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Class: {className} • Range: {ability.range}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Keywords */}
                  <div>
                    <h4 className="font-medium mb-1">Keywords</h4>
                    <div className="flex flex-wrap gap-1">
                      {ability.keywords?.map(keyword => (
                        <Badge key={`${uniqueKey}-keyword-${keyword}`} variant="outline">{keyword}</Badge>
                      )) || <span className="text-muted-foreground">None</span>}
                    </div>
                  </div>

                  {/* Costs */}
                  <div>
                    <h4 className="font-medium mb-1">Costs</h4>
                    <div className="flex flex-wrap gap-2">
                      {ability.costs?.mana && <Badge key={`${uniqueKey}-cost-mana`}>Mana: {ability.costs.mana}</Badge>}
                      {ability.costs?.rp && <Badge key={`${uniqueKey}-cost-rp`}>RP: {ability.costs.rp}</Badge>}
                      {ability.costs?.ap && <Badge key={`${uniqueKey}-cost-ap`}>AP: {ability.costs.ap}</Badge>}
                      {!ability.costs?.mana && !ability.costs?.rp && !ability.costs?.ap && 
                        <span className="text-muted-foreground">No costs</span>
                      }
                    </div>
                  </div>

                  {/* Requirements */}
                  <div>
                    <h4 className="font-medium mb-1">Requirements</h4>
                    <div>
                      {ability.requirements && ability.requirements.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1">
                          {ability.requirements.map((req, index) => (
                            <li key={`${uniqueKey}-req-${index}`}>
                              <span className="font-medium">{req.type}:</span> {req.description}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-muted-foreground">No special requirements</span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="font-medium mb-1">Description</h4>
                    <div className="prose max-w-none">
                      {ability.description.split('\n').map((paragraph, i) => (
                        <p key={`${uniqueKey}-para-${i}`}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        }
        return null;
      })}
    </div>
  );
}