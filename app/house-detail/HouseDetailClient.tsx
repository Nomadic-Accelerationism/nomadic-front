'use client'

import { useSearchParams } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import MenuHouseHeaderComponent from "@/components/MenuHouseHeader"
import HackerHouseDetailComponent from "@/components/HackerHouseDetail"
import HackerHouseParticipantsComponent from "@/components/HackerHouseParticipants"
import { Button } from "@/components/ui/button"
import { Journey } from '@/interfaces/Journey'
import { useRouter } from 'next/navigation';

export default function HouseDetail() {
  const searchParams = useSearchParams()
  const { publicAddress } = useUser()
  const router = useRouter();

  const journeyParam = searchParams.get('journey')
  const journey: Journey = journeyParam ? JSON.parse(journeyParam) : null

  if (!journey) return <div>Journey not found</div>

  const isMyJourney = journey.creatorAddress === publicAddress
  if (isMyJourney) {
    return (
      <>
        <MenuHouseHeaderComponent />
        <HackerHouseDetailComponent 
          number={journey.id || ''}
          location={journey.location}
          name={journey.title}
          description={journey.description}
          price={`${journey.budget} USDC`}
          startDate={journey.startDate ? new Date(journey.startDate).toLocaleDateString() : 'TBA'}
          endDate={journey.endDate ? new Date(journey.endDate).toLocaleDateString() : 'TBA'}
          imageUrl={journey.photo || '/placeholder.svg'}
        />
        <HackerHouseParticipantsComponent />
        <div className="flex flex-col items-center mt-4">
          <Button 
            className="w-full max-w-[230px] my-4 bg-[#ff671e] hover:bg-orange-500 text-black text-xl py-8 rounded-xl shadow-xl border border-gray-600"
            onClick={() => router.push(`/journey-edit?journey=${encodeURIComponent(JSON.stringify(journey))}`)}>
            Edit Journey
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <MenuHouseHeaderComponent />
      <HackerHouseDetailComponent 
        number={journey.id || ''}
        location={journey.location}
        name={journey.title}
        description={journey.description}
        price={`${journey.budget} USDC`}
        startDate={journey.startDate ? new Date(journey.startDate).toLocaleDateString() : 'TBA'}
        endDate={journey.endDate ? new Date(journey.endDate).toLocaleDateString() : 'TBA'}
        imageUrl={journey.photo || '/placeholder.svg'}
      />
      <HackerHouseParticipantsComponent />
      <div className="flex flex-col items-center mt-4">

        <Button 
          className="w-full max-w-[230px] my-4 bg-[#ff671e] hover:bg-orange-500 text-black text-xl py-8 rounded-xl shadow-xl border border-gray-600"
          onClick={() => console.log("Apply to Journey")}>
          Apply to Journey
        </Button>      
      </div>
    </>
  )
}