"use client";

import Image from "next/image";
import MenuUserHeaderComponent from "@/components/MenuUserHeader";
import JourneyPreviewComponent from "@/components/JourneyPreview";
import { useRouter } from 'next/navigation';

export default function HomeHouse() {

  const router = useRouter();

  const onEdit = () => {
    router.push('/journey-create');
  }


  return (
    <>
      <MenuUserHeaderComponent />
      <JourneyPreviewComponent 
        title="Bangkok Beer House"
        socialMedia={[
          { platform: 'telegram', username: '@Llamame' },
          { platform: 'twitter', username: '@Llamame' }
        ]}
        location="Bangkok conference center area,48966, Thailand..."
        startDate="11 Nov 24"
        endDate="17 Nov 24"
        budget={400}
        maxNomads={5}
        requiredProofs={[
          'ape', 'bayc', 'ethglobal', 'poap', 
          'nouns', 'talent', 'worldid'
        ]}
        question="What makes you the perfect candidate?"
        photo="/placeholder.svg?height=300&width=400"
        description="Lorem ipsum dolor sit amet consectetur..."
        onEdit={onEdit}
        onConfirm={() => {}}
      />
    </>
  );
}
