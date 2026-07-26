"use client";

import { Darker_Grotesque } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import React, { useState } from "react";
import { UserProvider } from "@/contexts/UserContext";
import { CuelumeProvider } from "@/components/cuelume/CuelumeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";

/** Display / large titles — tracking applied in CSS (-2%). */
const darkerGrotesque = Darker_Grotesque({
  subsets: ["latin"],
  variable: "--font-darker-grotesque",
  display: "swap",
});

/** Body / UI text — Satoshi Variable, tracking applied in CSS (-0.5%). */
const satoshi = localFont({
  src: "../fonts/Satoshi-Variable.ttf",
  variable: "--font-satoshi",
  display: "swap",
  weight: "300 900",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Stable client so Passport invalidation/refetch survives re-renders.
  const [queryClient] = useState(() => new QueryClient());
  // Minimal audit fix: Privy throws during prerender when appId is empty.
  // Only mount PrivyProvider when a real app id is configured.
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim() || "";

  return (
    <UserProvider>
      <QueryClientProvider client={queryClient}>
        <html
          lang="en"
          className={`${satoshi.variable} ${darkerGrotesque.variable}`}
        >
          <head>
            <link rel="icon" href="/favicon.png" />
          </head>
          <body className="font-sans antialiased">
            <CuelumeProvider>
              {privyAppId ? (
                <PrivyProvider appId={privyAppId}>{children}</PrivyProvider>
              ) : (
                children
              )}
            </CuelumeProvider>
          </body>
        </html>
      </QueryClientProvider>
    </UserProvider>
  );
}
