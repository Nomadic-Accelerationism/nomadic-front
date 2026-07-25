"use client";

import React, { useState } from "react";
import { Journey } from "@/interfaces/Journey";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Magic } from "magic-sdk";
import axios from "axios";
import { useUser } from "@/contexts/UserContext";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { JourneyDisplay } from "./journey-success/JourneyDisplay";
import { ConfirmationCodeModal } from "./modals/confirmation-code-modal";

const magic =
  typeof window !== "undefined"
    ? new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY || "")
    : null;

interface CancelJourneyProps {
  journey: Journey;
  isPending: boolean;
}

export function CancelJourney({ journey, isPending }: CancelJourneyProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [isConfirmationCodeModalOpen, setIsConfirmationCodeModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [didToken, setDidToken] = useState<string | null>(null);
  const router = useRouter();
  const { userMetadata } = useUser();

  const handleCancelVerification = async () => {
    try {
      setIsLoading(true);

      if (!magic || !userMetadata?.email) {
        throw new Error("Magic SDK not initialized or email not available");
      }

      const newDidToken = await magic.auth.loginWithEmailOTP({
        email: userMetadata.email,
        showUI: false,
      });

      console.log("Got didToken:", newDidToken);
      setDidToken(newDidToken);
      setIsCancelDialogOpen(false);
      setIsConfirmationCodeModalOpen(true);

    } catch (error) {
      console.error("Complete error details:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Verification failed",
      );
      setIsErrorDialogOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeVerification = async (code: string) => {
    try {
      setIsLoading(true);

      if (!didToken) {
        throw new Error("No authentication token available");
      }

      const updateResponse = await axios.post("/api/auth/update-journey", {
        journeyId: journey.id,
        status: "CANCELLED",
        didToken: didToken, 
      });

      if (updateResponse.data) {
        setIsConfirmationCodeModalOpen(false);
        router.push("/hacker-journeys");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Code verification failed"
      );
      setIsErrorDialogOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <JourneyDisplay
        journey={journey}
        isPending={isPending}
        onCancel={() =>
          isPending
            ? setIsCancelDialogOpen(true)
            : router.push("/journey-cancel")
        }
      />

      <AlertDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
      >
        <AlertDialogContent className="clay-surface clay-tone-white rounded-[28px] border-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Journey</AlertDialogTitle>
            <AlertDialogDescription>
              We will send a verification code to {userMetadata?.email} to
              confirm the cancellation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="clay-control rounded-[22px] bg-clay-peach" disabled={isLoading}>Cancel</AlertDialogCancel>
            <Button variant="clayPrimary" onClick={handleCancelVerification} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Send Verification Code"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmationCodeModal 
        isOpen={isConfirmationCodeModalOpen}
        onClose={() => setIsConfirmationCodeModalOpen(false)}
        onCodeSubmit={async (code) => {
          if (!didToken) {
            setErrorMessage("No authentication token available");
            setIsErrorDialogOpen(true);
            return;
          }
          await handleCodeVerification(code);
        }}
      />

      <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <AlertDialogContent className="clay-surface clay-tone-white rounded-[28px] border-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="clayPrimary" onClick={() => setIsErrorDialogOpen(false)}>OK</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
