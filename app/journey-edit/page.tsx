import { Suspense } from "react";
import JourneyEditClient from "./JourneyEditClient";

export const dynamic = "force-dynamic";

export default function JourneyEdit() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JourneyEditClient />
    </Suspense>
  );
}
