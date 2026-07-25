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

export default function MenuHouseHeaderComponent() {
  const menuItems = [
    "Home",
    "My Hacker Houses",
    "$NACC Tokens",
    "Attestate a Nomad",
    "Pending Reviews",
    "About"
  ];
  const menuToneClasses = [
    "bg-clay-peach",
    "bg-clay-mint",
    "bg-clay-sky",
    "bg-clay-lilac",
    "bg-clay-butter",
    "bg-clay-white",
  ];

  return (
    <Sheet>
      <header className="clay-surface clay-tone-white sticky top-3 z-40 mx-auto mt-3 flex w-[calc(100%_-_1.5rem)] max-w-md items-center justify-between rounded-[24px] px-5 py-3">
        <div className="flex items-center">
          <Image
            src="/images/nomadic.png"
            alt="Nomadic Logo"
            width={43}
            height={43}
            className="mr-2"
          />
          <div className="flex flex-col">
            <p className="text-2xl font-bold pb-0">Nomadic</p>
            <p className="text-sm font-medium text-clay-muted">Hacker House</p>
          </div>
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
            <nav className="mt-8">
              {menuItems.map((item, index) => (
                <Button
                  asChild
                  key={item}
                  variant="claySecondary"
                  className={`mb-3 h-14 w-full justify-start rounded-[22px] text-lg ${menuToneClasses[index % menuToneClasses.length]}`}
                >
                  <a href="#">{item}</a>
                </Button>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4 space-y-4 border-t">
            <Button variant="claySecondary" className="w-full justify-start bg-clay-sky">
              Switch to Nomad Profile
            </Button>
            <Button variant="claySecondary" className="w-full justify-start bg-clay-peach">
              Logout
            </Button>
            <p className="text-xs text-center mt-4">v.0.01a</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
