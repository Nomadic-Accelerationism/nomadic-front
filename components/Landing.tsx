"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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
    <div className="relative h-screen w-full overflow-hidden">
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
          <Image
            src="/images/nomadic-logo.png"
            alt="Nomadic Logo"
            width={100}
            height={100}
          />
        </div>

        <div
          className={`flex flex-col items-center space-y-4 transition-opacity duration-500 ${
            showLoginElements ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Link href="/login-user">
            <button className="bg-[#ff671e] text-xl text-black font-semibold py-4 px-6 rounded-xl shadow-lg border border-gray-500 hover:bg-orange-500 transition duration-300">
              Nomad Email Login
            </button>
          </Link>
          <div className="flex items-center space-x-4">
            <div className="h-px w-16 bg-gray-500"></div>
            <span className="text-gray-500">or</span>
            <div className="h-px w-16 bg-gray-500"></div>
          </div>
          <Link href="/login-house" className="text-black underline hover:text-orange-400 transition duration-300">
            Hacker House Email Login
          </Link>
        </div>

        <div className="w-full px-8 mb-4 space-y-2">
          <p className={`text-center text-xs text-gray-800 transition-opacity duration-500 ${
            showLoginElements ? 'opacity-100' : 'opacity-0'
          }`}>
            By continuing, you agree to the <Link href="#" className="underline">Privacy Policy</Link> and <Link href="#" className="underline">Terms and conditions</Link>
          </p>
          <p className="text-center text-xs text-gray-800">v.0.01a</p>
        </div>
      </div>
    </div>
  );
}