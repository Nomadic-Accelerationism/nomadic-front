"use client"

// import type { Metadata } from "next";
// import Head from 'next/head';
import { Inter } from "next/font/google";
import localFont from 'next/font/local'
import "./globals.css";
import React from 'react';
import { UserProvider } from '@/contexts/UserContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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
  return (
    <UserProvider>
      <QueryClientProvider client={new QueryClient()}>
        <html lang="en">
          <head>
            <link rel="icon" href="/favicon.png" />
          </head>
          <body className={`${satoshi.variable} font-satoshi`}>
            {children}
          </body>
        </html>
      </QueryClientProvider>
    </UserProvider>
  );
}
