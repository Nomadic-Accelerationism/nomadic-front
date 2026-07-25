"use client";

import React from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button"
import {  MenuIcon, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';  // Make sure this path matches your actual UserContext location
import Link from 'next/link';

export default function MenuUserHeaderComponent() {
  const router = useRouter();
  const { logout } = useUser();
  
  const menuItems = [
    { name: "Passport", url: "/passport" },
    { name: "Home", url: "/home-user" },
    { name: "My Proofs", url: "/user-proofs" },
    { name: "Journeys", url: "/hacker-journeys" },
    // Legacy demo surfaces intentionally not promoted:
    // { name: "$NACC Tokens", url: "/nacc-tokens" },
    // { name: "Generate Single Use ID", url: "/generate-single-use-id" },
    // { name: "Recommend a Nomad", url: "/recommend" },
    // { name: "Pending Reviews", url: "/reviews" },
    { name: "About", url: "/about" },
  ];
  const menuToneClasses = [
    "bg-clay-peach",
    "bg-clay-mint",
    "bg-clay-sky",
    "bg-clay-lilac",
    "bg-clay-butter",
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <Sheet>
      <header className="clay-surface clay-tone-white sticky top-3 z-40 mx-auto mt-3 flex w-[calc(100%-1.5rem)] max-w-md items-center justify-between rounded-[24px] px-5 py-3">
        <div className="flex items-center">
          <Link href="/passport">
            <div className="flex items-center cursor-pointer">
              <Image
                src="/images/nomadic.svg"
                alt="Nomadic Logo"
                width={43}
                height={43}
                className="mr-2"
              />
              <span className="text-2xl font-bold">Nomadic</span>
            </div>
          </Link>
        </div>
        <SheetTrigger asChild>
          <Button variant="clayIcon" className="text-clay-ink">
            <MenuIcon className="h-6 w-6" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
      </header>
      <SheetContent side="left" className="w-[300px] border-none bg-clay-canvas p-0 shadow-clay sm:w-[400px]">
        <div className="clay-page-gradient flex h-full flex-col">
          <SheetHeader className="p-4 flex justify-between items-center border-b">
            <SheetTitle className="flex items-center">
              <Image
                src="/images/nomadic.svg"
                alt="Nomadic Logo"
                width={40}
                height={40}
                className="mr-2"
              />
              <span className="text-xl font-bold">Nomadic</span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-grow overflow-y-auto px-4">

            <nav className="flex flex-1 flex-col gap-2 mt-4">
              {menuItems.map((item, index) => (
                <Button
                  key={item.name}
                  asChild
                  variant="claySecondary"
                  className={`h-14 justify-start rounded-[22px] text-lg font-bold ${menuToneClasses[index % menuToneClasses.length]}`}
                >
                  <Link href={item.url}>{item.name}</Link>
                </Button>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-4 space-y-1">

            <div className="flex flex-col">
              <div className="w-1/2 border-t border-black mb-2"></div>
              <Button variant="claySecondary" className="w-full justify-start bg-clay-sky">
                Switch to Hacker House Profile
              </Button>
            </div>
            
            <div className="flex flex-col">
              <div className="w-1/2 border-t border-black mb-2"></div>
              <Button variant="claySecondary" className="w-full justify-start bg-clay-butter">
                Bug Report
              </Button>
            </div>

            <div className="flex flex-col">
              <div className="w-1/2 border-t border-black mb-2"></div>
              <Button 
                variant="claySecondary"
                className="w-full justify-start bg-clay-peach"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>

            <p className="text-xs text-center mt-4 pt-4">v.0.01a</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
