import { Suspense } from "react";
import JourneyEditClient from "./JourneyEditClient";
import { ClayState } from "@/components/ui/clay-state";

export const dynamic = "force-dynamic";

export default function JourneyEdit() {
  return (
    <Suspense fallback={<ClayState kind="loading" title="Loading journey editor" />}>
      <JourneyEditClient />
    </Suspense>
  );
}
