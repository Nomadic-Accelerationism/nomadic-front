import React from 'react';
import { Button } from "@/components/ui/button"

export default function HomeUserComponent() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-between">
      {/* Background gradient */}
      <div
        className="absolute inset-0 z-0"
        style={{
          zIndex: 0,
          backgroundSize: '100% 100%',
          backgroundPosition: 'bottom',
          backgroundImage: 'linear-gradient(to top, #fe7432 5%, #ffcfb8 40%, white 60%, white 100%)'
      }}
      ></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center mt-36 flex-grow w-full max-w-md px-6">
        <h1 className="text-2xl font-bold mb-12 text-center">Are you ready?</h1>
        
        <Button 
          className="w-full max-w-[200px] mb-4 bg-[#ff671e] hover:bg-orange-500 text-black text-xl py-8 rounded-xl shadow-xl border border-gray-600"
        >
          My Proofs
        </Button>
        
        <Button 
          className="w-full max-w-[200px] bg-[#ff671e] hover:bg-orange-500 text-black text-xl py-8 rounded-xl shadow-xl border border-gray-600"
        >
          Journeys
        </Button>
      </div>

      {/* Version number */}
      <div className="relative z-10 mb-4">
        <p className="text-xs text-gray-800">v.0.01a</p>
      </div>
    </div>
  );
}