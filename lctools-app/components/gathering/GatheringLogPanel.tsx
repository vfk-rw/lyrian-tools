"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
// import { GatheringState } from '@/lib/gathering/types'; // No longer needed directly if only log is passed

interface GatheringLogPanelProps {
  log: string[]; // Assuming log is always an array of strings from GatheringState
}

const GatheringLogPanel: React.FC<GatheringLogPanelProps> = ({ log = [] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gathering Log</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48 w-full rounded-md border p-4 text-sm">
          {log.length > 0 ? (
            log.map((entry, index) => (
              <div key={index} className="mb-1">
                {entry}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No log entries yet.</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default GatheringLogPanel;
