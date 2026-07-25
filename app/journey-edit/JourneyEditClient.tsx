'use client';

import { useSearchParams } from 'next/navigation';
import MenuUserHeaderComponent from "@/components/MenuUserHeader";
import JourneyEditComponent from "@/components/JourneyEdit";
import { ClayState } from "@/components/ui/clay-state";

export default function JourneyEditClient() {
  const searchParams = useSearchParams();
  const journeyParam = searchParams.get('journey');
  const journey = journeyParam ? JSON.parse(journeyParam) : null;

  if (!journey) {
    return <ClayState kind="error" title="Journey not found" description="Return to My Journeys and choose an available journey." />;
  }
  
  return (
    <div className="clay-page min-h-screen">
      <MenuUserHeaderComponent />
      <JourneyEditComponent journey={journey} />
    </div>
  );
}
