"use client"

import { Journey } from '@/interfaces/Journey'
import { CancelJourney } from './CancelJourney'
import { AcceptedJourney } from './AcceptedJourney'

interface StatusHandlerProps {
  journey: Journey
}

export function StatusHandler({ journey }: StatusHandlerProps) {
  const isPending = journey.status === 'PENDING'
  
  if (journey.status === 'CONFIRMED') {
    return <AcceptedJourney journey={journey} />
  }

  return <CancelJourney journey={journey} isPending={isPending} />
}