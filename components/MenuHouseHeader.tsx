"use client";

import React from 'react';
import { Button } from "@/components/ui/button"
import { MenuIcon, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { NomadicWordmark } from "@/components/shell/NomadicBrand";

export default function MenuHouseHeaderComponent() {
  const menuItems = [
    "Home",
    "My Hacker Houses",
    "$NACC Tokens",
    "Attestate a Nomad",
    "Pending Reviews",
    "About"
  ];

  return (
    <Sheet>
      <header className="flex items-center justify-between px-6 pt-8 pb-2 bg-white">
        <div className="flex flex-col items-start gap-1">
          <NomadicWordmark height={28} decorative />
          <span className="sr-only">Nomadic</span>
          <p className="text-sm text-gray-800">Hacker House</p>
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
              <NomadicWordmark height={24} decorative />
              <span className="sr-only">Nomadic</span>
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
              Switch to Nomad Profile
            </Button>
            <Button variant="ghost" className="w-full text-left justify-start">
              Logout
            </Button>
            <p className="text-xs text-center mt-4">v.0.02a</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
