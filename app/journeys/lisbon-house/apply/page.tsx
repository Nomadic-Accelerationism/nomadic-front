"use client";

import { MobileAppShell } from "@/components/shell/MobileAppShell";
import { LisbonHouseApplyScreen } from "@/components/journeys/LisbonHouseApplyScreen";

export default function LisbonHouseApplyPage() {
  return (
    <MobileAppShell showNav={false}>
      <LisbonHouseApplyScreen />
    </MobileAppShell>
  );
}
