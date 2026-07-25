import { Suspense } from 'react';
import JourneyPreviewClient from './JourneyPreviewClient';
import { ClayState } from "@/components/ui/clay-state";

export const dynamic = 'force-dynamic';

export default function JourneyPreview() {
  return (
    <Suspense fallback={<ClayState kind="loading" title="Loading journey preview" />}>
      <JourneyPreviewClient />
    </Suspense>
  );
}
