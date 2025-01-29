import { Suspense } from 'react';
import JourneyPreviewClient from './JourneyPreviewClient';

export const dynamic = 'force-dynamic';

export default function JourneyPreview() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JourneyPreviewClient />
    </Suspense>
  );
}