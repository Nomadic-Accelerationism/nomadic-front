'use client';

import { useSearchParams } from 'next/navigation';
import MenuUserHeaderComponent from "@/components/MenuUserHeader";
import JourneyEditComponent from "@/components/JourneyEdit";

export default function JourneyEditClient() {
  const searchParams = useSearchParams();
  const journeyParam = searchParams.get('journey');
  const journey = journeyParam ? JSON.parse(journeyParam) : null;

  if (!journey) return <div>Journey not found</div>;
  
  return (
    <div className="clay-page min-h-screen">
      <MenuUserHeaderComponent />
      <JourneyEditComponent journey={journey} />
    </div>
  );
}
