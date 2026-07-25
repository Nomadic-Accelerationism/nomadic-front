"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from "@/components/ui/button";

export default function LandingComponent() {
  
  const [showOverlay, setShowOverlay] = useState(false);
  const [showLoginElements, setShowLoginElements] = useState(false);

  useEffect(() => {
    const overlayTimer = setTimeout(() => {
      setShowOverlay(true);
    }, 2000);

    const loginElementsTimer = setTimeout(() => {
      setShowLoginElements(true);
    }, 3000);

    return () => {
      clearTimeout(overlayTimer);
      clearTimeout(loginElementsTimer);
    };
  }, []);

  return (
    <div className="clay-page-gradient relative h-screen w-full overflow-hidden">
      {/* Overlay (background) */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-[#fe7432] via-[#ffcfb8] to-transparent transition-all duration-1000 ease-in-out ${
          showOverlay ? 'opacity-80' : 'opacity-0'
        } `}
        style={{
            zIndex: 0,
            backgroundSize: '100% 100%',
            backgroundPosition: 'bottom',
            backgroundImage: 'linear-gradient(to top, #fe7432 5%, #ffcfb8 40%, white 60%, white 100%)'
          }} >
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full w-full bg-transparent">
        <div
          className={`transition-all duration-1000 ease-in-out ${
            showLoginElements ? 'mt-36' : 'mt-[50vh] -translate-y-1/2'
          }`}
        >
          <div className="clay-surface clay-tone-white flex h-36 w-36 items-center justify-center rounded-full">
            <Image
              src="/images/nomadic.webp"
              alt="Nomadic Logo"
              width={100}
              height={100}
              priority
            />
          </div>
        </div>

        <div
          className={`clay-surface clay-tone-white mx-5 flex w-[calc(100%-2.5rem)] max-w-sm flex-col items-center space-y-4 px-7 py-7 transition-opacity duration-500 ${
            showLoginElements ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Button asChild variant="clayPrimary" size="clay" className="w-full text-lg">
            <Link href="/login-user">
              Nomad Email Login
            </Link>
          </Button>
          <div className="flex items-center space-x-4">
            <div className="h-px w-16 bg-clay-muted/40"></div>
            <span className="text-sm font-semibold text-clay-muted">or</span>
            <div className="h-px w-16 bg-clay-muted/40"></div>
          </div>
          <Button asChild variant="claySecondary" size="clay" className="w-full text-base">
            <Link href="/login-house">Hacker House Email Login</Link>
          </Button>
        </div>

        <div className="w-full px-8 mb-4 space-y-2">
          <p className={`text-center text-xs text-gray-800 transition-opacity duration-500 ${
            showLoginElements ? 'opacity-100' : 'opacity-0'
          } text-clay-muted`}>
            By continuing, you agree to the <Link href="#" className="underline">Privacy Policy</Link> and <Link href="#" className="underline">Terms and conditions</Link>
          </p>
          <p className="text-center text-xs font-semibold text-clay-ink">v.0.01a</p>
        </div>
      </div>
    </div>
  );
}
