"use client";

import { MobileAppShell } from "@/components/shell/MobileAppShell";
import { LisbonHouseJourneyScreen } from "@/components/journeys/LisbonHouseJourneyScreen";

export default function LisbonHouseJourneyPage() {
  return (
    <MobileAppShell showNav={false}>
      <LisbonHouseJourneyScreen />
    </MobileAppShell>
  );
}
