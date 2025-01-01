"use client"

import React,{useEffect, useState} from 'react'
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation';
import Image from 'next/image'
import { Journey } from '@/interfaces/Journey';


export default function JourneySuccessComponent() {
  const [journey, setJourney] = useState<Journey | null>(null)
  const router = useRouter()
  
  useEffect(() => {
    const journeyData = localStorage.getItem('createdJourney')
    const photo = localStorage.getItem('journeyTempPhoto')
  
    if (journeyData) {
      const parsedJourney = JSON.parse(journeyData)
      setJourney({
        ...parsedJourney,
        photo: photo || parsedJourney.photo
      })
    }
  }, [])
  if (!journey) {
    return <div>Loading...</div>
  
  }

  
  return (
    <div className="w-full max-w-md mx-auto bg-white p-6 rounded-lg">
      <h1 className="text-2xl font-bold text-center mb-4">
        Your Journey #{journey.id} {journey.title} was created
      </h1>

      <div className="relative h-48 w-full mb-4 rounded-lg overflow-hidden">
        <Image
          src={journey.photo || '/placeholder.svg'}
          alt={journey.title}
          fill
          className="object-cover"
          priority
        />
      </div>

      <p className="text-gray-600 text-center mb-6">
        Please wait a few hours, your Journey is being reviewed for your security
        and the security of the ones using the platform.
        
        If you have any questions please send a XMTP message to nacc.eth
      </p>

      <div className="flex items-center justify-center mb-6">
        <Button 
          className="w-full max-w-[230px] bg-[#ff671e] hover:bg-orange-500 text-black text-xl py-8 rounded-xl shadow-xl border border-gray-600"
          onClick={() => router.push('/hacker-journeys')}
        >
          LFG
        </Button>
      </div>

      <div className="text-center">
        <button
          onClick={() => router.push('/journey-cancel')}
          className="text-gray-500 underline hover:text-gray-700"
        >
          Cancel journey
        </button>
      </div>
    </div>
  )
}