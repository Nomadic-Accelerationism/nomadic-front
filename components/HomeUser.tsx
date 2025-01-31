"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation';
import { ConfirmationCodeModal } from './modals/confirmation-code-modal';
import { SuccessfulModal } from './modals/successful-modal';

export default function HomeUserComponent() {

  const [isOpen, setIsOpen] = useState(false)
  const [isOpenSuccess, setIsOpenSuccess] = useState(false)

  const router = useRouter();

  const goToProofs = () => {
    router.push('/user-proofs'); 
  }; 

  const goToJourneys = () => {
    router.push('/hacker-journeys'); 
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-between" style={{ minHeight: 'calc(100vh - 80px)' }}>
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
          className="w-full max-w-[200px] mb-4 nomadic-button"
          onClick={goToProofs}
        >
          My Proofs
        </Button>
        
        <Button 
          className="w-full max-w-[200px] nomadic-button"
          onClick={goToJourneys}
        >
          Journeys
        </Button>


      <div>
      <br />
        <Button onClick={() => setIsOpen(true)} variant="outline" className="text-lg">
          Confirmation Code
        </Button>
        <ConfirmationCodeModal open={isOpen} onOpenChange={setIsOpen} />
      </div>

      <br />
      <Button onClick={() => setIsOpenSuccess(true)} variant="outline" className="text-lg">
        Show Success
      </Button>

      <SuccessfulModal open={isOpenSuccess} onOpenChange={setIsOpenSuccess} />

      </div>


      <div>
    </div>      

      {/* Version number */}
      <div className="relative z-10 mb-4">
        <p className="text-xs text-gray-800">v.0.01a</p>
      </div>
    </div>
  );
}