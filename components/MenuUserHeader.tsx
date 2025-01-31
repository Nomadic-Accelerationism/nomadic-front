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
    { name: "Home", url: "/home-user" },
    { name: "My Proofs", url: "/user-proofs" },
    { name: "Journeys", url: "/hacker-journeys" },
    { name: "$NACC Tokens", url: "/nacc-tokens" },
    { name: "Generate Single Use ID", url: "/generate-single-use-id" },
    { name: "Recommend a Nomad", url: "/recommend" },
    { name: "Pending Reviews", url: "/reviews" },
    { name: "About", url: "/about" }
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <Sheet>
      <header className="flex items-center justify-between px-6 pt-8 pb-2 bg-white">
        <div className="flex items-center">
          <Image
            src="/images/nomadic.svg"
            alt="Nomadic Logo"
            width={43}
            height={43}
            className="mr-2"
          />
          <span className="text-2xl font-bold">Nomadic</span>
        </div>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-gray-700">
            <MenuIcon className="h-6 w-6" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
      </header>
      <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
        <div className="h-full bg-gradient-to-t from-[#ff7231] via-[#ffc4a8] to-white flex flex-col">
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
              {menuItems.map((item) => (
                <Button
                  key={item.name}
                  asChild
                  variant="secondary"
                  className="h-14 justify-start rounded-2xl bg-gray-100 text-lg font-normal text-black hover:bg-white/90 border border-black"
                >
                  <Link href={item.url}>{item.name}</Link>
                </Button>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-4 space-y-1">

            <div className="flex flex-col">
              <div className="w-1/2 border-t border-black mb-2"></div>
              <Button variant="ghost" className="w-full text-left justify-start pl-0">
                Switch to Hacker House Profile
              </Button>
            </div>
            
            <div className="flex flex-col">
              <div className="w-1/2 border-t border-black mb-2"></div>
              <Button variant="ghost" className="w-full text-left justify-start pl-0">
                Bug Report
              </Button>
            </div>

            <div className="flex flex-col">
              <div className="w-1/2 border-t border-black mb-2"></div>
              <Button 
                variant="ghost" 
                className="w-full text-left justify-start pl-0"
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
