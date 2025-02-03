"use client";
import { useSearchParams } from 'next/navigation';
import { JourneyFormData } from '@/interfaces/Journey';
import MenuUserHeaderComponent from "@/components/MenuUserHeader";
import JourneyPreviewComponent from "@/components/JourneyPreview";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function JourneyPreviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const formDataString = searchParams.get('formData');
  let formData: JourneyFormData | null = null;
  
  if (formDataString) {
    const parsedData = JSON.parse(formDataString);
     const savedPhoto = localStorage.getItem('journeyTempPhoto');
    formData = {
      ...parsedData,
      startDate: parsedData.startDate ? new Date(parsedData.startDate) : undefined,
      finishDate: parsedData.finishDate ? new Date(parsedData.finishDate) : undefined,
      photo: savedPhoto || '/placeholder.svg?height=300&width=400' 
    };
  }
  useEffect(() => {
    return () => {
      localStorage.removeItem('journeyTempPhoto');
    };
  }, []);

  const onEdit = () => {
    router.push('/journey-create');
  };

  if (!formData) {
    return <div>No journey data available</div>;
  }

  return (
    <>
      <MenuUserHeaderComponent />
      <JourneyPreviewComponent 
        title={formData.title}
        location={formData.location}
        startDate={formData.startDate}
        endDate={formData.finishDate}
        budget={formData.budget}
        guestCapacity={formData.guestCapacity}
        requiredProofs={formData.requiredProofs}
        customProofs={formData.customProofs}
        optionalQuestion={formData.optionalQuestion}
        photo={formData.photo || "/placeholder.svg?height=300&width=400"}
        description={formData.description}
        onEdit={onEdit}
        onConfirm={() => {}}
      />
    </>
  );
}