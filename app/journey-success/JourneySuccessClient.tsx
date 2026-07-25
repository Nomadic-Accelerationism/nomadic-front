'use client';

import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import MenuUserHeaderComponent from "@/components/MenuUserHeader";
import JourneySucessComponent from "@/components/journey-success/JourneySuccess";
import { Journey } from '@/interfaces/Journey'
import { useUser } from '@/contexts/UserContext'
import { api } from '@/lib/axios'
import { ClayState } from "@/components/ui/clay-state";

async function fetchJourney({ id, publicAddress, didToken }: { 
  id: string
  publicAddress: string 
  didToken: string
}) {
  const response = await api.post('/api/auth/get-journey', {
    journeyId: id,
    publicAddress,
    didToken
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
      publicAddress,
      didToken 
    }),
    enabled: Boolean(journeyId) && isAuthenticated
  })

  if (isLoading) return <ClayState kind="loading" title="Loading journey" />
  if (!journey) return <ClayState kind="error" title="Journey not found" description="The requested journey is unavailable or no longer exists." />

  return (
    <div className="clay-page min-h-screen">
      <MenuUserHeaderComponent />
      <JourneySucessComponent journey={journey} />
    </div>
  );
}
