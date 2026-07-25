"use client"

// import type { Metadata } from "next";
// import Head from 'next/head';
import { Inter } from "next/font/google";
import localFont from 'next/font/local'
import "./globals.css";
import React from 'react';
import { UserProvider } from '@/contexts/UserContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {PrivyProvider} from '@privy-io/react-auth';


const inter = Inter({ subsets: ["latin"] });

const satoshi = localFont({
  src: '../fonts/Satoshi-Variable.ttf',
  variable: '--font-satoshi'
})

// export const metadata: Metadata = {
//   title: "Nomadic",
//   description: "Nomadic",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Minimal audit fix: Privy throws during prerender when appId is empty.
  // Only mount PrivyProvider when a real app id is configured.
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim() || '';

  return (
    <UserProvider>
      <QueryClientProvider client={new QueryClient()}>
        <html lang="en">
          <head>
            <link rel="icon" href="/favicon.png" />
          </head>
          <body className={`${satoshi.variable} font-satoshi`}>
            {privyAppId ? (
              <PrivyProvider appId={privyAppId}>{children}</PrivyProvider>
            ) : (
              children
            )}
          </body>
        </html>
      </QueryClientProvider>
    </UserProvider>
  );
}
