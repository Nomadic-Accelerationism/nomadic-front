"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

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
    <div className="flex flex-col items-center justify-between min-h-screen px-8 bg-white">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center mt-36">
          <Image
            src="/images/nomadic-logo.png"
            alt="Nomadic Logo"
            width={100}
            height={100}
          />
          <h2 className="mt-12 text-sm">Hacker House Login or Register</h2>
          <p className="mt-6 text-xl font-bold">Create your dream hack space</p>
          <p className="mt-2 text-sm text-gray-600 text-center">
            Enter your email below to receive a magic sign-in link. We recommend using a personal email for continuity.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="relative mx-8">
            <Input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={handleEmailChange}
              className="pr-12 rounded-xl"
            />
            <Button
              type="submit"
              className="absolute right-0 top-0 bottom-0 rounded-l-none rounded-r-xl px-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Button>
          </div>

        <div className="">
          <div className="flex justify-between space-x-1 ml-8 mr-8">
            {code.map((digit, index) => (
              <Input
                key={index}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                className="w-10 h-12 text-center rounded-md bg-gray-300 border border-gray-800"
              />
            ))}
          </div>
        </div>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-gray-600 hover:text-gray-900"
          >
            Send new code
          </Button>
        </form>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">v.0.01a</p>
      </div>
    </div>
  );
}