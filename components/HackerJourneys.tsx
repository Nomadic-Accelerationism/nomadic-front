"use client";

import React from 'react';
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation';
import HackerJourneyListComponent from './HackerJourneyList';
import { AvailableJourneys } from "./AvailableJourneys";

export default function HackerJourneysComponent() {

  const router = useRouter();

  const goToCreateJourney = () => {
    router.push('/journey-create'); 
  }; 

  return (
    <div className="clay-page relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-between" style={{ minHeight: 'calc(100vh - 80px)' }}>
      {/* Main Title */}
      <h1 className="clay-surface clay-tone-peach mx-6 mt-8 mb-7 w-[calc(100%-3rem)] max-w-md px-6 py-6 text-center text-3xl font-bold">
        Journeys & Hacker Houses
      </h1>

      {/* Content */}
      <div className=" flex flex-col items-center flex-grow w-full max-w-md px-6">
        <AvailableJourneys />
        <HackerJourneyListComponent />
 
        <Button 
          variant="clayPrimary"
          size="clay"
          className="my-6 w-full max-w-[260px] text-lg"
          onClick={goToCreateJourney}
        >
          Create Journey
        </Button>
      </div>

      <div className="relative z-10 mb-4">
        <p className="text-xs font-semibold text-clay-muted">v.0.01a</p>
      </div>
    </div>
  );
}
