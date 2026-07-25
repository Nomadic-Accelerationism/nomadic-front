"use client";

import dynamic from "next/dynamic";
import MenuUserHeaderComponent from "@/components/MenuUserHeader";

// Minimal audit fix: UserProofs uses Privy hooks. Without a Privy app id
// (and thus without PrivyProvider), SSR/prerender would crash. Client-only
// load keeps the route inspectable when Privy is not configured.
const UserProofsComponent = dynamic(
  () => import("@/components/UserProofs"),
  { ssr: false }
);

export default function Home() {
  return (
    <div className="clay-page min-h-screen">
      <MenuUserHeaderComponent />
      <UserProofsComponent />
    </div>
  );
}
