"use client"

import { ClassData } from "@/lib/classes/class-utils";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ClassCardProps {
  classData: ClassData;
  className?: string;
}

export function ClassCard({ classData, className }: ClassCardProps) {
  // Function to get tier color
  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return "bg-blue-500 hover:bg-blue-600";
      case 2: return "bg-purple-500 hover:bg-purple-600";
      case 3: return "bg-amber-500 hover:bg-amber-600";
      default: return "bg-gray-500 hover:bg-gray-600";
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
    <Link href={`/classes/${classData.id}`}>
      <Card className={cn("h-full overflow-hidden transition-all hover:shadow-md", className)}>
        <CardHeader className="p-0">
          <div className="relative h-48 w-full overflow-hidden">
            <Image
              src={classData.image_url}
              alt={classData.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform hover:scale-105"
              priority={false}
            />
            <Badge 
              className={cn("absolute right-2 top-2 text-white", getTierColor(classData.tier))}
            >
              Tier {classData.tier}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xl font-bold">{classData.name}</h3>
            <div className="flex items-center gap-1">
              {Array.from({ length: classData.difficulty }).map((_, i) => (
                <span key={i} className="text-yellow-500">★</span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className={cn("text-white", getRoleColor(classData.main_role))}>
              {classData.main_role}
            </Badge>
            {classData.secondary_role && (
              <Badge className={cn("text-white", getRoleColor(classData.secondary_role))}>
                {classData.secondary_role}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {classData.description.split('.')[0]}.
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
}
