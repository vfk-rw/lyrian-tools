"use client";

import LCToolsSidebarClient from "@/components/lctools-sidebar-client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import GatheringSetupPanel from "@/components/gathering/GatheringSetupPanel";
import GatheringActionsPanel from "@/components/gathering/GatheringActionsPanel";
import GatheringStatusPanel from "@/components/gathering/GatheringStatusPanel";
import GatheringLogPanel from "@/components/gathering/GatheringLogPanel";
import GatheringResultsPanel from "@/components/gathering/GatheringResultsPanel";

import { GatheringState } from "@/lib/gathering/types"; // Import GatheringState from types
import { initialGatheringState } from "@/lib/gathering/state"; // Keep initialGatheringState from state
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { PlayIcon, RefreshCcwIcon } from "lucide-react";

export default function GatheringPage() {
  const [gatheringState, setGatheringState] = useState<GatheringState>(initialGatheringState);
  const [isStarted, setIsStarted] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  function resetGathering() {
    setGatheringState(initialGatheringState);
    setIsStarted(false);
    setIsEnded(false);
    setShowResetConfirm(false);
  }

  function startGathering() {
    if (!isStarted) {
      setIsStarted(true);
      setGatheringState(prev => ({
        ...prev,
        log: [...prev.log, "Gathering began."]
      }));
    }
  }

  // End the gathering attempt manually
  function endGathering() {
    if (isStarted && !isEnded) {
      setGatheringState(prev => ({
        ...prev,
        log: [...prev.log, "Gathering ended."]
      }));
      setIsEnded(true);
    }
  }

  useEffect(() => {
    if (isStarted && !isEnded && gatheringState.diceRemaining <= 0) {
      setGatheringState(prev => ({
        ...prev,
        log: [...prev.log, "Gathering ended."]
      }));
      setIsEnded(true);
    }
  }, [gatheringState.diceRemaining, isStarted, isEnded]);

  const isSetupValid = gatheringState.nodeHP > 0 && gatheringState.nodePoints > 0;

  return (
    <SidebarProvider>
      <LCToolsSidebarClient />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Gathering</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex gap-3 mb-6 px-4">
          <Button onClick={startGathering} disabled={isStarted || !isSetupValid} size="lg" className="gap-2">
            <PlayIcon className="h-4 w-4" />
            Start Gathering
          </Button>
          <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="lg" className="gap-2">
                <RefreshCcwIcon className="h-4 w-4" />
                Reset Gathering
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Gathering Session</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset your current progress. Your gathering setup will be preserved, but all progress and actions will be reset.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetGathering}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={endGathering} disabled={!isStarted || isEnded} size="lg" className="gap-2">
            End Gathering Attempt
          </Button>
          {!isSetupValid && !isStarted && (
            <p className="text-sm text-amber-500 flex items-center ml-2">
              Please complete the setup before starting gathering.
            </p>
          )}
        </div>
        {/* Setup row */}
        <div className="p-4">
          <GatheringSetupPanel setGatheringState={setGatheringState} />
        </div>
        {/* Status / Actions & Log rows */}
        <div className="grid grid-cols-3 gap-4 p-4">
          <div className="col-span-1 space-y-4">
            <GatheringStatusPanel state={gatheringState} />
            <GatheringResultsPanel state={gatheringState} setState={setGatheringState} isStarted={isStarted} isEnded={isEnded} />
          </div>
          <div className="col-span-2 space-y-4">
            <GatheringActionsPanel state={gatheringState} setState={setGatheringState} isStarted={isStarted} />
            <GatheringLogPanel log={gatheringState.log} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
