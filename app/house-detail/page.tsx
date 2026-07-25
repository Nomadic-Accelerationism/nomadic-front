import { Suspense } from 'react';
import HouseDetailClient from './HouseDetailClient';
import { ClayState } from "@/components/ui/clay-state";

export default function HouseDetail() {
  return (
    <Suspense fallback={<ClayState kind="loading" title="Loading Hacker House" />}>
      <HouseDetailClient />
    </Suspense>
  );
}
