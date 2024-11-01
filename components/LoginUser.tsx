"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Magic } from 'magic-sdk';
import axios from 'axios';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from "lucide-react";


// Move Magic initialization inside a function to ensure client-side only execution
const createMagic = () => {
  return typeof window !== 'undefined' 
    ? new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY || '')
    : null;
};

const magic = createMagic();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (magic) {
  magic.preload();
}


export default function UserLoginComponent() {

  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { setUserMetadata, setDidToken, setPublicAddress } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleCodeChange = (index: number, value: string) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
  };

  const requestOTP = async (email: string) => {
    try {
      setIsLoading(true);
      if (!magic) {
        throw new Error('Magic SDK is not initialized');
      }
      
      const didToken = await magic.auth.loginWithEmailOTP({ email: email });
      const userInfo = await magic.user.getInfo();
      
      setDidToken(didToken || '');

      const response = await axios.post('/api/auth/validate-otp', {
        email,
        didToken
      });
      
      const metadata = response.data.metadata;
      console.log('metadata: ', metadata);

      setUserMetadata(metadata);
      if (metadata.publicAddress && setPublicAddress) {
        setPublicAddress(metadata.publicAddress);
        localStorage.setItem('publicAddress',metadata.publicAddress);
        localStorage.setItem('didToken', didToken || "");
      }

      router.push('/home-user');
      
    } catch (error) {
      console.error('Magic SDK error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailRegex.test(email)) {
      setIsAlertOpen(true);
      return;
    }
    
    try {
      await requestOTP(email);
    } catch (error) {
      // Handle error appropriately
      console.error('Failed to send OTP:', error);
    }
  };

  const requestNewOTP = () => {
    if (!emailRegex.test(email)) {
      setIsAlertOpen(true);
      return;
    }
    requestOTP(email);
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
          <h2 className="mt-12 text-sm">Nomad Login or Register</h2>
          <p className="mt-6 text-xl font-bold">Travel, share, hack and enjoy</p>
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
              disabled={isLoading}
            />
            <Button
              type="submit"
              className="absolute right-0 top-0 bottom-0 rounded-l-none rounded-r-xl px-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              )}
            </Button>
          </div>

        {/* <div className="">
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
        </div> */}

          <Button
            type="button"
            variant="ghost"
            className="w-full text-gray-600 hover:text-gray-900"
            onClick={requestNewOTP}
          >
            Send new code
          </Button>
        </form>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">v.0.01a</p>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Invalid Email</AlertDialogTitle>
            <AlertDialogDescription>
              Please enter a valid email address.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => setIsAlertOpen(false)}>
              OK
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
