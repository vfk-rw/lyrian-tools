"use client"

import { ClassData } from "@/lib/classes/class-utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ClassDetailProps {
  classData: ClassData;
}

export function ClassDetail({ classData }: ClassDetailProps) {
  // Function to get tier color
  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return "bg-blue-500";
      case 2: return "bg-purple-500";
      case 3: return "bg-amber-500";
      default: return "bg-gray-500";
    }
  };

  // Function to get role color
  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "striker": return "bg-red-500";
      case "defender": return "bg-blue-500";
      case "controller": return "bg-purple-500";
      case "support": return "bg-green-500";
      case "artisan": return "bg-amber-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Class Image and Basic Info */}
        <div className="md:w-1/3">
          <Card>
            <div className="relative aspect-square w-full overflow-hidden rounded-t-lg">
              <Image
                src={classData.image_url}
                alt={classData.name}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
                priority
              />
            </div>
            <CardContent className="p-4">
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge className={cn("text-white", getTierColor(classData.tier))}>
                  Tier {classData.tier}
                </Badge>
                <Badge className={cn("text-white", getRoleColor(classData.main_role))}>
                  {classData.main_role}
                </Badge>
                {classData.secondary_role && (
                  <Badge className={cn("text-white", getRoleColor(classData.secondary_role))}>
                    {classData.secondary_role}
                  </Badge>
                )}
              </div>
              
              <div className="mb-2">
                <p className="text-sm font-medium text-muted-foreground">Difficulty</p>
                <div className="flex items-center">
                  {Array.from({ length: classData.difficulty }).map((_, i) => (
                    <span key={i} className="text-yellow-500">★</span>
                  ))}
                  {Array.from({ length: 5 - classData.difficulty }).map((_, i) => (
                    <span key={i} className="text-gray-300">★</span>
                  ))}
                </div>
              </div>
              
              {classData.requirements && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Requirements</p>
                  <ul className="list-inside list-disc text-sm">
                    {classData.requirements.conditions.map((condition, index) => (
                      <li key={index}>{condition.description}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Class Details */}
        <div className="flex-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">{classData.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="description">
                <TabsList className="mb-4">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="guide">Guide</TabsTrigger>
                </TabsList>
                
                <TabsContent value="description" className="space-y-4">
                  <div className="whitespace-pre-line">{classData.description}</div>
                </TabsContent>
                
                <TabsContent value="guide" className="space-y-4">
                  <div className="whitespace-pre-line">{classData.guide}</div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Progression */}
      <Card>
        <CardHeader>
          <CardTitle>Class Progression</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {classData.progression.map((level) => (
              <div key={level.level} className="rounded-lg border p-4">
                <h3 className="mb-2 text-lg font-bold">Level {level.level}</h3>
                <div className="space-y-2">
                  {level.benefits.map((benefit, index) => (
                    <div key={index} className="rounded-md bg-muted p-2">
                      {benefit.type === "ability" && (
                        <p>
                          <span className="font-medium">New Ability:</span>{" "}
                          {benefit.value}
                        </p>
                      )}
                      
                      {benefit.type === "skills" && (
                        <div>
                          <p>
                            <span className="font-medium">Skill Points:</span>{" "}
                            {benefit.points} points
                          </p>
                          {benefit.eligible_skills && benefit.eligible_skills.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              Eligible skills: {benefit.eligible_skills.join(", ")}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {benefit.type === "attribute_choice" && benefit.options && (
                        <div>
                          <p>
                            <span className="font-medium">Attribute Choice:</span>{" "}
                            Choose {benefit.choose} from:
                          </p>
                          <ul className="list-inside list-disc text-sm">
                            {benefit.options.map((option, optIndex) => (
                              <li key={optIndex}>
                                {option.attribute} +{option.value}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Abilities */}
      {classData.abilities && classData.abilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Abilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {classData.abilities.map((ability) => (
                <div key={ability.id} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-lg font-bold">{ability.name}</h3>
                    <div className="flex flex-wrap gap-1">
                      {ability.type && (
                        <Badge variant="outline">{ability.type}</Badge>
                      )}
                      {ability.keywords && ability.keywords.map((keyword) => (
                        <Badge key={keyword} variant="secondary">{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-2 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {ability.range && (
                      <div>
                        <p className="text-xs text-muted-foreground">Range</p>
                        <p className="text-sm">{ability.range}</p>
                      </div>
                    )}
                    
                    {ability.costs && (
                      <div>
                        <p className="text-xs text-muted-foreground">Cost</p>
                        <p className="text-sm">
                          {ability.costs.ap ? `${ability.costs.ap} AP ` : ""}
                          {ability.costs.rp ? `${ability.costs.rp} RP ` : ""}
                          {ability.costs.mana ? `${ability.costs.mana} Mana` : ""}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {ability.description && (
                    <div className="mt-2">
                      <Separator className="mb-2" />
                      <p className="whitespace-pre-line">{ability.description}</p>
                    </div>
                  )}
                  
                  {ability.requirements && ability.requirements.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground">Requirements</p>
                      <ul className="list-inside list-disc text-sm">
                        {ability.requirements.map((req, index) => (
                          <li key={index}>{req.description}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
