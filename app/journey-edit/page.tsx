"use client"
import MenuUserHeaderComponent from "@/components/MenuUserHeader";
import JourneyEditComponent from "@/components/JourneyEdit";
import { useSearchParams } from 'next/navigation'

export default function JourneyEditPage() {
  const searchParams = useSearchParams()
  const journeyParam = searchParams.get('journey')
  const journey = journeyParam ? JSON.parse(journeyParam) : null

  if (!journey) return <div>Journey not found</div>

  return (
    <>
      <MenuUserHeaderComponent />
      <JourneyEditComponent journey={journey} />
    </>
  )
}