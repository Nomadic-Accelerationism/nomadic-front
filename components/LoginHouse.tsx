"use client";

import React, { useState } from 'react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from 'next/link';
import { NomadicWordmark } from "@/components/shell/NomadicBrand";
import { MobileAppShell } from "@/components/shell/MobileAppShell";

export default function HouseLoginComponent() {

  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleCodeChange = (index: number, value: string) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
  };

  return (
    <MobileAppShell
      showHeader={false}
      showNav={false}
      contentClassName="justify-center px-6 py-8 sm:px-7"
    >
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col justify-between">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <div className="flex flex-col items-center text-center">
          <NomadicWordmark height={36} decorative />
          <span className="sr-only">Nomadic</span>
          <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--nomadic-muted)]">
            Hacker House login
          </p>
          <h1 className="font-display mt-3 text-[30px] font-black leading-[0.95] tracking-display text-[var(--nomadic-ink)]">
            Create your dream
            <br />
            hack space
          </h1>
          <p className="mt-4 max-w-[19rem] text-sm leading-relaxed text-[var(--nomadic-muted)]">
            Enter your email below to receive a magic sign-in link. We recommend using a personal email for continuity.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="relative">
            <Input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={handleEmailChange}
              className="pr-12"
            />
            <Button
              asChild
              className="absolute bottom-0 right-0 top-0 rounded-l-none px-3"
            >
              <Link href="/home-house" aria-label="Continue with email">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </Button>
          </div>

        <div>
          <div className="flex justify-between gap-2">
            {code.map((digit, index) => (
              <Input
                key={index}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                className="h-12 w-10 px-0 text-center"
                aria-label={`Verification code digit ${index + 1}`}
              />
            ))}
          </div>
        </div>

          <Button
            type="button"
            variant="quiet"
            className="w-full"
          >
            Send new code
          </Button>
        </form>
      </div>

      <div className="pt-8 text-center">
        <p className="text-xs text-[var(--nomadic-muted)]">v.0.02a</p>
      </div>
      </div>
    </MobileAppShell>
  );
}
