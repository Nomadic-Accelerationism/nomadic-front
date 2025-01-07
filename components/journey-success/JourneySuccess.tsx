"use client"

import { useEffect, useState } from "react"
import {useSearchParams} from "next/navigation"
import { Journey } from '@/interfaces/Journey';
import {StatusHandler} from "./StatusHandler";


export default function JourneySuccess() {
  const [journey, setJourney] = useState<Journey | null>(null)
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const status = searchParams.get('status')
    
    if (status === 'pending') {
      setJourney({
        id: searchParams.get('id') || '',
        title: searchParams.get('title') || '',
        photo: searchParams.get('photo') || '',
        status: 'PENDING'
      } as Journey)
    } else {
      const journeyData = localStorage.getItem('createdJourney')
      const photo = localStorage.getItem('journeyTempPhoto')
    
      if (journeyData) {
        const parsedJourney = JSON.parse(journeyData)
        setJourney({
          ...parsedJourney,
          photo: photo || parsedJourney.photo
        })
      }
    }
  }, [searchParams])

  if (!journey) return <div>Loading...</div>

  return <StatusHandler journey={journey} />
}