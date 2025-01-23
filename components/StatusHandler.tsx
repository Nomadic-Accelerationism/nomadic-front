"use client"

import { Journey } from '@/interfaces/Journey'
import { CancelJourney } from '@/components/CancelJourney'
import { JourneyDisplay } from '@/components/journey-success/JourneyDisplay'
import { useRouter } from 'next/navigation'

interface StatusHandlerProps {
  journey: Journey
}

export function StatusHandler({ journey }: StatusHandlerProps) {
  const router = useRouter()

  switch (journey.status) {
    case 'CONFIRMED':
      router.push('/house-detail')
      return null
    case 'PENDING':
      return <CancelJourney journey={journey} isPending={true} />
    case 'FINISHED':
      return <JourneyDisplay journey={journey} isPending={false} onCancel={() => {}} />
    case 'CANCELLED':
      return <JourneyDisplay journey={journey} isPending={false} onCancel={() => {}} />
    default:
      return <JourneyDisplay journey={journey} isPending={false} onCancel={() => {}} />
  }
}