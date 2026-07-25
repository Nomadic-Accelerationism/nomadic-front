"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function HomeUserComponent() {
  const router = useRouter();

  return (
    <div
      className="relative flex w-full flex-col items-center justify-between overflow-hidden"
      style={{ minHeight: "calc(100vh - 80px)" }}
    >
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundSize: "100% 100%",
          backgroundPosition: "bottom",
          backgroundImage:
            "linear-gradient(to top, #fe7432 5%, #ffcfb8 40%, white 60%, white 100%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 mt-36 flex w-full max-w-md flex-grow flex-col items-center px-6">
        <h1 className="mb-4 text-center text-2xl font-bold">Are you ready?</h1>
        <p className="mb-10 max-w-xs text-center text-sm text-gray-700">
          Open your Nomadic Passport to manage identity and credentials.
        </p>

        <Button
          className="nomadic-button max-w-[230px]"
          onClick={() => router.push("/passport")}
        >
          Nomadic Passport
        </Button>

        <Button
          variant="outline"
          className="mb-4 h-12 w-full max-w-[230px] rounded-xl border-black/40 bg-white/80 text-base font-semibold text-black"
          onClick={() => router.push("/user-proofs")}
        >
          My Proofs
        </Button>

        <Button
          variant="outline"
          className="h-12 w-full max-w-[230px] rounded-xl border-black/40 bg-white/80 text-base font-semibold text-black"
          onClick={() => router.push("/hacker-journeys")}
        >
          Journeys
        </Button>
      </div>

      <div className="relative z-10 mb-4">
        <p className="text-xs text-gray-800">v.0.01a</p>
      </div>
    </div>
  );
}
