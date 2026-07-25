"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function HomeUserComponent() {
  const router = useRouter();

  return (
    <div
      className="clay-page-gradient relative flex w-full flex-col items-center justify-between overflow-hidden"
      style={{ minHeight: "calc(100vh - 80px)" }}
    >
      <div className="relative z-10 mt-24 flex w-full max-w-md flex-grow flex-col items-center px-6">
        <div className="clay-surface clay-tone-white mb-9 w-full px-6 py-7 text-center">
        <h1 className="mb-3 text-center text-3xl font-bold">Are you ready?</h1>
        <p className="mx-auto max-w-xs text-center text-sm text-clay-muted">
          Open your Nomadic Passport to manage identity and credentials.
        </p>
        </div>

        <Button
          variant="clayPrimary"
          size="clay"
          className="mb-5 w-full max-w-[260px] text-lg"
          onClick={() => router.push("/passport")}
        >
          Nomadic Passport
        </Button>

        <Button
          variant="claySecondary"
          size="clay"
          className="mb-5 w-full max-w-[260px]"
          onClick={() => router.push("/user-proofs")}
        >
          My Proofs
        </Button>

        <Button
          variant="claySecondary"
          size="clay"
          className="w-full max-w-[260px] bg-clay-mint"
          onClick={() => router.push("/hacker-journeys")}
        >
          Journeys
        </Button>
      </div>

      <div className="relative z-10 mb-4">
        <p className="text-xs font-semibold text-clay-ink">v.0.01a</p>
      </div>
    </div>
  );
}
