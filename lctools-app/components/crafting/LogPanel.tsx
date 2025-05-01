'use client'

import React, { useRef, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { CraftingState } from '@/lib/crafting/types'

interface LogPanelProps {
  state: CraftingState
}

export default function LogPanel({ state }: LogPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when log updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.log]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log</CardTitle>
        <CardDescription>Crafting session history</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={scrollRef} className="h-52 overflow-auto font-mono text-sm p-4">
          {state.log.map((line, i) => {
            // Color coding for different log events
            let lineClass = '';
            if (line.includes('Crafting began.')) {
              lineClass = 'text-blue-600 dark:text-blue-400 font-semibold';
            } else if (line.includes('Crafting ended.')) {
              lineClass = 'text-red-600 dark:text-red-400 font-semibold';
            } else if (line.includes('Added')) {
              lineClass = 'text-emerald-600 dark:text-emerald-400';
            } else if (line.includes('Rolled')) {
              lineClass = 'text-indigo-600 dark:text-indigo-400';
            } else if (line.includes('bonus')) {
              lineClass = 'text-amber-600 dark:text-amber-400';
            }
            
            return (
              <React.Fragment key={i}>
                <p className={lineClass}>
                  {line}
                </p>
                {i < state.log.length - 1 && <Separator className="my-2" />}
              </React.Fragment>
            );
          })}
          
          {state.log.length === 0 && (
            <p className="text-muted-foreground italic">No crafting logs yet. Start crafting to see the history.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}