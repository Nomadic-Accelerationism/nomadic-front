import { Suspense } from "react";
import JourneySuccessClient from "./JourneySuccessClient";

export const dynamic = "force-dynamic";

export default function JourneySuccess() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JourneySuccessClient />
    </Suspense>
  );
}
