'use client';

import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import MenuUserHeaderComponent from "@/components/MenuUserHeader";
import JourneySucessComponent from "@/components/journey-success/JourneySuccess";
import { Journey } from '@/interfaces/Journey'
import { useUser } from '@/contexts/UserContext'
import axios from 'axios'

async function fetchJourney({ id, didToken, publicAddress }: { 
  id: string
  didToken: string
  publicAddress: string 
}) {

  console.log('--------------------------------')
  console.log("UI fetching journey")
  console.log('id', id)
  console.log('didToken', didToken)
  console.log('publicAddress', publicAddress)
  console.log('--------------------------------')

  const response = await axios.post('/api/auth/get-journey', {
    journeyId: id,
    didToken,
    publicAddress
  })
  return response.data.journey
}

export default function JourneySuccessClient() {
  const searchParams = useSearchParams()
  const journeyId = searchParams.get('id')
  const { didToken, publicAddress, isAuthenticated } = useUser()

  const { data: journey, isLoading } = useQuery({
    queryKey: ['journey', journeyId, didToken, publicAddress],
    queryFn: () => fetchJourney({ 
      id: journeyId as string, 
      didToken, 
      publicAddress 
    }),
    enabled: Boolean(journeyId) && isAuthenticated
  })

  if (isLoading) return <div>Loading...</div>
  if (!journey) return <div>Journey not found</div>

  return (
    <>
      <MenuUserHeaderComponent />
      <JourneySucessComponent journey={journey} />
    </>
  );
}