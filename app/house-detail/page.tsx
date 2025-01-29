import { Suspense } from 'react';
import HouseDetailClient from './HouseDetailClient';

export default function HouseDetail() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HouseDetailClient />
    </Suspense>
  );
}