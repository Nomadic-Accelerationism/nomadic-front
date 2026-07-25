import Image from "next/image";
import MenuUserHeaderComponent from "@/components/MenuUserHeader";
import JourneyApplyComponent from "@/components/JourneyApply";
import { Suspense } from 'react';
import { ClayState } from "@/components/ui/clay-state";

export default function JourneyApplyPage() {
  return (
    <div className="clay-page min-h-screen">
      <MenuUserHeaderComponent />
      <Suspense fallback={<ClayState kind="loading" title="Loading journey application" />}>
        <JourneyApplyComponent />
      </Suspense>
    </div>
  );
}
