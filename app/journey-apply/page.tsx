import Image from "next/image";
import MenuUserHeaderComponent from "@/components/MenuUserHeader";
import JourneyApplyComponent from "@/components/JourneyApply";
import { Suspense } from 'react';

export default function JourneyApplyPage() {
  return (
    <>
      <MenuUserHeaderComponent />
      <Suspense fallback={<div>Loading...</div>}>
        <JourneyApplyComponent />
      </Suspense>
    </>
  );
}