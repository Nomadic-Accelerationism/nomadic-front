import { Suspense } from "react";
import JourneySuccessClient from "./JourneySuccessClient";
import { ClayState } from "@/components/ui/clay-state";

export const dynamic = "force-dynamic";

export default function JourneySuccess() {
  return (
    <Suspense fallback={<ClayState kind="loading" title="Loading journey status" />}>
      <JourneySuccessClient />
    </Suspense>
  );
}
