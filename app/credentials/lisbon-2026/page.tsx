"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MenuUserHeaderComponent from "@/components/MenuUserHeader";
import { useUser } from "@/contexts/UserContext";

export default function LisbonCredentialPlaceholderPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useUser();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace("/login-user");
    }
  }, [isAuthenticated, isInitialized, router]);

  return (
    <>
      <MenuUserHeaderComponent />
      {!isInitialized || !isAuthenticated ? (
        <div
          className="flex min-h-[50vh] w-full items-center justify-center"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-8 w-8 animate-spin text-[#ff671e]" aria-hidden />
          <span className="sr-only">Loading</span>
        </div>
      ) : (
        <div
          className="relative flex w-full flex-col items-center overflow-hidden"
          style={{ minHeight: "calc(100vh - 80px)" }}
        >
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage:
                "linear-gradient(to top, #fe7432 5%, #ffcfb8 40%, white 60%, white 100%)",
              backgroundSize: "100% 100%",
              backgroundPosition: "bottom",
            }}
            aria-hidden
          />

          <div className="relative z-10 flex w-full max-w-md flex-grow flex-col px-6 pb-10 pt-8">
            <div className="mb-6 flex flex-col items-center text-center">
              <Image
                src="/images/nomadic.webp"
                alt="Nomadic"
                width={64}
                height={64}
              />
              <h1 className="mt-4 text-2xl font-bold text-black">
                Nomadic Lisbon 2026
              </h1>
              <p className="mt-2 text-sm text-gray-700">
                A World Selfie Check–verified credential claimed through Nomadic
                during ETHGlobal Lisbon 2026.
              </p>
            </div>

            <div className="rounded-2xl border border-black/80 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-black">
                Verification not connected yet
              </p>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                World Selfie Check, server verification, and credential claims
                are not available in this build. This page is a Passport
                placeholder only — nothing has been verified or saved.
              </p>
              <p className="mt-3 rounded-xl bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700">
                Status: Not claimed
              </p>
            </div>

            <Button
              asChild
              variant="outline"
              className="mt-6 h-12 w-full rounded-xl border-black bg-white text-base font-semibold"
            >
              <Link href="/passport">Back to Passport</Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
