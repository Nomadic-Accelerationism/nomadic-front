"use client"

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, SlidersHorizontal } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useUser } from '@/contexts/UserContext'
import axios from "axios"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Journey, JourneyStatusEnum } from '@/interfaces/Journey'
import { useQuery } from '@tanstack/react-query'

export default function HackerJourneyListComponent() {
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date')
  const { didToken, publicAddress, isAuthenticated } = useUser()

  const sortJourneysByType = useCallback((by: 'date' | 'status', journeysToSort: Journey[]) => {
    return [...journeysToSort].sort((a, b) => {
      if (by === 'date') {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0
        return dateA - dateB
      } else {
        const statusOrder = [
          JourneyStatusEnum.CONFIRMED,
          JourneyStatusEnum.PENDING,
          JourneyStatusEnum.FINISHED,
          JourneyStatusEnum.CANCELLED
        ]
        return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
      }
    })
  }, [])

  const { data: journeys = [], isLoading, error } = useQuery({
    queryKey: ['hackerJourneys', didToken, publicAddress],
    queryFn: async () => {
      const response = await axios.post('/api/auth/get-hacker-journeys', {
        didToken,
        publicAddress
      })
      const fetchedJourneys = response.data.journeys || []
      return sortJourneysByType(sortBy, fetchedJourneys)
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10 // 10 minutes
  })

  const handleSort = useCallback((by: 'date' | 'status') => {
    setSortBy(by)
    if (journeys) {
      const sortedJourneys = sortJourneysByType(by, journeys)
      return sortedJourneys
    }
  }, [journeys, sortJourneysByType])

  if (isLoading) {
    return (
      <div className="clay-surface clay-tone-white container mx-auto my-4 flex h-64 items-center justify-center px-4" role="status">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-clay-peach border-b-clay-ink"></div>
        <span className="sr-only">Loading journeys</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="clay-surface clay-tone-peach container mx-auto my-4 px-5 py-6">
        <div className="text-center font-semibold text-red-800">
          {error instanceof Error ? error.message : error}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: JourneyStatusEnum) => {
    switch (status) {
      case JourneyStatusEnum.CONFIRMED: return 'bg-green-500'
      case JourneyStatusEnum.PENDING: return 'bg-orange-500'
      case JourneyStatusEnum.FINISHED: return 'bg-gray-500'
      case JourneyStatusEnum.CANCELLED: return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="clay-surface clay-tone-white container mx-auto my-4 px-5 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-center">My Journeys</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="clayIcon" aria-label="Sort journeys">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="clay-surface clay-tone-white rounded-[22px] border-none">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleSort('date')}>
              Date {sortBy === 'date' && '✓'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort('status')}>
              Status {sortBy === 'status' && '✓'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {journeys.length === 0 ? (
        <div className="clay-surface clay-tone-butter py-8 text-center">
          <p className="font-semibold text-clay-muted">No journeys found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {journeys.map((journey) => {
            const isClickable = journey.status !== JourneyStatusEnum.CANCELLED && 
                              journey.status !== JourneyStatusEnum.FINISHED;

            const JourneyContent = (
              <div className={`clay-image-frame bg-clay-sky ${
                isClickable ? 'clay-interactive' : ''
              } ${
                !isClickable ? 'opacity-75 cursor-not-allowed' : ''
              }`}>
                <div className="relative h-32 overflow-hidden rounded-[22px]">
                  <Image
                    src={journey.photo || '/placeholder.svg'}
                    alt={journey.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />

                  <div className="p-4 relative z-10">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h2 className="text-white text-lg font-semibold">{journey.title}</h2>
                        <p className="text-white text-md">
                          {journey.startDate ? new Date(journey.startDate).toLocaleDateString() : 'TBA'} - 
                          {journey.endDate ? new Date(journey.endDate).toLocaleDateString() : 'TBA'}
                        </p>
                      </div>
                      {isClickable && <ChevronRight className="h-6 w-6 text-white" />}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`clay-chip px-2 py-1 text-xs font-semibold text-white ${getStatusColor(journey.status)}`}>
                        {journey.status}
                      </span>
                      <span className="clay-chip bg-clay-white px-2 py-1 text-xs font-bold text-clay-ink">
                        {journey.budget}$
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );

            return isClickable ? (
              <Link 
                href={
                  journey.status === JourneyStatusEnum.CONFIRMED 
                    ? {
                        pathname: '/house-detail',
                        query: { id: journey.id }
                      }
                    : journey.status === JourneyStatusEnum.PENDING 
                      ? {
                          pathname: '/journey-success',
                          query: { id: journey.id }
                        }
                      : `/journey/${journey.id}`
                } 
                key={journey.id} 
                className="block rounded-[28px] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-clay-ink"
              >
                {JourneyContent}
              </Link>
            ) : (
              <div key={journey.id}>
                {JourneyContent}
              </div>
            );
          })}
        </div>
      )}
    </div>
  )
}
