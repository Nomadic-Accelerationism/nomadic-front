"use client";

import { Journey } from "@/interfaces/Journey";
import { StatusHandler } from "@/components/StatusHandler";

interface JourneySuccessProps {
  journey: Journey;
}

export default function JourneySuccess({ journey }: JourneySuccessProps) {
  if (!journey) return <div>Loading...</div>;

  return <StatusHandler journey={journey} />;
}
