"use client";

import React from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button"
import { MenuIcon, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export default function MenuUserHeaderComponent() {
  const menuItems = [
    "Home",
    "My Proofs",
    "Journeys",
    "$NACC Tokens",
    "Generate Single Use ID",
    "Recommend a Nomad",
    "Pending Reviews",
    "About"
  ];

  return (
    <Sheet>
      <header className="flex items-center justify-between px-6 pt-8 pb-2 bg-white">
        <div className="flex items-center">
          <Image
            src="/images/nomadic.png"
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
                src="/images/nomadic.png"
                alt="Nomadic Logo"
                width={40}
                height={40}
                className="mr-2"
              />
              <span className="text-xl font-bold">Nomadic</span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-grow overflow-y-auto px-4">
            <nav className="mt-8">
              {menuItems.map((item, index) => (
                <a
                  key={index}
                  href="#"
                  className="block px-4 py-2 text-lg font-semibold text-gray-800 hover:bg-white hover:bg-opacity-30 rounded-lg mb-2"
                >
                  {item}
                </a>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4 space-y-4 border-t">
            <Button variant="ghost" className="w-full text-left justify-start">
              Switch to Hacker House Profile
            </Button>
            <Button variant="ghost" className="w-full text-left justify-start">
              Logout
            </Button>
            <p className="text-xs text-center mt-4">v.0.01a</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}