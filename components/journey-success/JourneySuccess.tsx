"use client";

import { Journey } from "@/interfaces/Journey";
import { StatusHandler } from "@/components/StatusHandler";
import { ClayState } from "@/components/ui/clay-state";

interface JourneySuccessProps {
  journey: Journey;
}

export default function JourneySuccess({ journey }: JourneySuccessProps) {
  if (!journey) return <ClayState kind="loading" title="Loading journey" />;

  return <StatusHandler journey={journey} />;
}
