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
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-between" style={{ minHeight: 'calc(100vh - 80px)' }}>
      {/* Main Title */}
      <h1 className="text-3xl font-bold text-center mt-8 mb-6">
        Journeys & Hacker Houses
      </h1>

      {/* Content */}
      <div className=" flex flex-col items-center flex-grow w-full max-w-md px-6">
        <AvailableJourneys />
        <HackerJourneyListComponent />

        <Button 
          className="w-full max-w-[230px] my-4 bg-[#ff671e] hover:bg-orange-500 text-black text-xl py-8 rounded-xl shadow-xl border border-gray-600"
          onClick={goToCreateJourney}
        >
          Create Journey
        </Button>
      </div>

      <div className="relative z-10 mb-4">
        <p className="text-xs text-gray-800">v.0.01a</p>
      </div>
    </div>
  );
}