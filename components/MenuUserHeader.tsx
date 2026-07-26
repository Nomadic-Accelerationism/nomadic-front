"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MenuIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import Link from "next/link";

/**
 * Slim header for secondary/legacy screens.
 * Product navigation is Explore + Passport via MobileAppShell bottom nav.
 * Internal/test routes are intentionally omitted.
 */
export default function MenuUserHeaderComponent() {
  const router = useRouter();
  const { logout } = useUser();

  const menuItems = [
    { name: "Explore", url: "/explore" },
    { name: "Passport", url: "/passport" },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <Sheet>
      <header className="flex items-center justify-between bg-[var(--nomadic-app-bg)] px-6 pb-2 pt-8">
        <div className="flex items-center">
          <Link href="/explore">
            <div className="flex cursor-pointer items-center">
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
          <Button variant="ghost" size="icon" className="text-gray-700">
            <MenuIcon className="h-6 w-6" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
      </header>
      <SheetContent side="left" className="w-[300px] p-0 sm:w-[400px]">
        <div className="flex h-full flex-col bg-[var(--nomadic-app-bg)]">
          <SheetHeader className="flex items-center justify-between border-b p-4">
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
            <nav className="mt-4 flex flex-1 flex-col gap-2">
              {menuItems.map((item) => (
                <Button
                  key={item.name}
                  asChild
                  variant="secondary"
                  className="h-14 justify-start rounded-2xl border border-black bg-gray-100 text-lg font-normal text-black hover:bg-white/90"
                >
                  <Link href={item.url}>{item.name}</Link>
                </Button>
              ))}
            </nav>
          </div>

          <div className="mt-auto space-y-1 p-4">
            <div className="flex flex-col">
              <div className="mb-2 w-1/2 border-t border-black"></div>
              <Button
                variant="ghost"
                className="w-full justify-start pl-0 text-left"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
