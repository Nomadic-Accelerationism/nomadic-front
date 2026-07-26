"use client";

import { useEffect, useState } from "react";
import type { PassportAvailability } from "@/lib/ensv2/passport-availability";
import { availabilityToInputState } from "@/lib/ensv2/passport-availability";
import {
  normalizePassportHandle,
  validatePassportHandle,
} from "@/lib/passport/handle";
import type { InputVisualState } from "@/components/ui/input";

export type HandleAvailabilityUi = {
  raw: string;
  setRaw: (value: string) => void;
  clear: () => void;
  label: string;
  passportName: string | null;
  handleValid: boolean;
  validationMessage: string | null;
  status: PassportAvailability["status"] | "idle" | "checking" | "empty";
  message: string | null;
  visualState: InputVisualState;
};

const DEBOUNCE_MS = 400;

export function usePassportHandleAvailability(
  initial = ""
): HandleAvailabilityUi {
  const [raw, setRaw] = useState(initial);
  const [status, setStatus] = useState<
    PassportAvailability["status"] | "idle" | "checking" | "empty"
  >("empty");
  const [message, setMessage] = useState<string | null>(null);

  const label = normalizePassportHandle(raw);
  const validated = validatePassportHandle(raw);
  const handleValid = validated.ok;
  const passportName = validated.ok ? validated.passportName : null;
  const validationMessage = validated.ok ? null : validated.message;

  useEffect(() => {
    const current = validatePassportHandle(raw);

    if (!raw.trim()) {
      setStatus("empty");
      setMessage(null);
      return;
    }

    if (!current.ok) {
      setStatus(current.code === "RESERVED" ? "reserved" : "invalid");
      setMessage(current.message);
      return;
    }

    let cancelled = false;
    setStatus("checking");
    setMessage("Checking if that name is free…");

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/passport/availability?label=${encodeURIComponent(current.label)}`,
            { cache: "no-store" }
          );
          const body = (await res.json()) as PassportAvailability & {
            reason?: string;
          };
          if (cancelled) return;
          const next = body.status ?? "unavailable";
          setStatus(next);
          if (next === "available") {
            setMessage("This name is available.");
          } else if (next === "taken") {
            setMessage("That Passport name is already taken.");
          } else if (next === "reserved") {
            setMessage(body.reason || "That Passport name is reserved.");
          } else if (next === "invalid") {
            setMessage(body.reason || "Choose a valid Passport name.");
          } else {
            setMessage(
              body.reason || "Name availability could not be checked right now."
            );
          }
        } catch {
          if (cancelled) return;
          setStatus("unavailable");
          setMessage("Name availability could not be checked right now.");
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [raw]);

  const visualState = availabilityToInputState(status);

  return {
    raw,
    setRaw,
    clear: () => setRaw(""),
    label,
    passportName,
    handleValid,
    validationMessage,
    status,
    message,
    visualState,
  };
}
