"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from 'next/link';

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
    <div className="clay-page flex min-h-screen flex-col items-center justify-between px-5 py-8">
      <div className="w-full max-w-md space-y-7">
        <div className="flex flex-col items-center pt-12">
          <div className="clay-surface clay-tone-white flex h-32 w-32 items-center justify-center rounded-full">
            <Image
              src="/images/nomadic.webp"
              alt="Nomadic Logo"
              width={88}
              height={88}
              priority
            />
          </div>
          <div className="clay-surface clay-tone-lilac mt-8 w-full px-6 py-6 text-center">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-clay-muted">Hacker House Login or Register</h2>
          <p className="mt-4 text-2xl font-bold">Create your dream hack space</p>
          <p className="mt-2 text-sm text-clay-muted text-center">
            Enter your email below to receive a magic sign-in link. We recommend using a personal email for continuity.
          </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="clay-surface clay-tone-white space-y-5 px-5 py-6">
          <div className="relative">
            <Input
              variant="clay"
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={handleEmailChange}
              className="pr-16"
            />
            <Link href="/home-house">
              <Button
                variant="clayIcon"
                type="button"
                className="absolute right-1 top-1 h-12 w-12"
                aria-label="Continue to Hacker House"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            </Link>
          </div>

        <div className="">
          <div className="flex justify-between space-x-1 ml-8 mr-8">
            {code.map((digit, index) => (
              <Input
                variant="clay"
                key={index}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                className="h-12 w-10 rounded-[16px] px-0 text-center"
              />
            ))}
          </div>
        </div>

          <Button
            type="button"
            variant="claySecondary"
            size="clay"
            className="w-full"
          >
            Send new code
          </Button>
        </form>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs font-semibold text-clay-muted">v.0.01a</p>
      </div>
    </div>
  );
}
