"use client";

import React from 'react';
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation';
import HackerHouseListComponent from './HackerHouseList';

export default function HomeHouseComponent() {

  const router = useRouter();

  const goToProofs = () => {
    router.push('/user-proofs'); 
  }; 

  return (
    <div className="clay-page relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-between" style={{ minHeight: 'calc(100vh - 80px)' }}>

      {/* Content */}

      <div className="relative z-10 flex flex-col items-center mt-8 flex-grow w-full max-w-md px-6">

        <HackerHouseListComponent />

        <Button 
          variant="clayPrimary"
          size="clay"
          className="my-6 w-full max-w-[260px] text-lg"
          onClick={goToProofs}
        >
          Create Hacker House
        </Button>
        
      </div>

      {/* Version number */}
      <div className="relative z-10 mb-4">
        <p className="text-xs font-semibold text-clay-muted">v.0.01a</p>
      </div>
    </div>
  );
}
