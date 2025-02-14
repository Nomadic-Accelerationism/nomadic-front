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
      <div className="container mx-auto px-4 my-4 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 my-4">
        <div className="text-red-500 text-center">
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
    <div className="container mx-auto px-4 my-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-center">My Journeys</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
        <div className="text-center py-8">
          <p className="text-gray-500">No journeys found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {journeys.map((journey) => {
            const isClickable = journey.status !== JourneyStatusEnum.CANCELLED && 
                              journey.status !== JourneyStatusEnum.FINISHED;

            const JourneyContent = (
              <div className={`rounded-lg overflow-hidden shadow-lg ${
                !isClickable ? 'opacity-75 cursor-not-allowed' : ''
              }`}>
                <div className="relative h-28">
                  <div className="absolute inset-0 bg-gray-500/40 z-0" />
                  <Image
                    src={journey.photo || '/placeholder.svg'}
                    alt={journey.title}
                    layout="fill"
                    className="object-contain"
                    style={{ zIndex: -2 }}
                  />

                  <div className="p-4 relative z-10">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h2 className="text-white text-lg font-semibold">{journey.title}</h2>
                        <p className="text-white text-md">
                          {journey.startDate ? new Date(journey.startDate).toLocaleDateString() : 'TBA'} - 
                          {journey.endDate ? new Date(journey.endDate).toLocaleDateString() : 'TBA'}
                        </p>
                      </div>
                      {isClickable && <ChevronRight className="h-6 w-6 text-gray-400" />}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(journey.status)}`}>
                        {journey.status}
                      </span>
                      <span className="bg-white text-black px-2 py-1 rounded-full text-xs font-semibold">
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
                        query: { journey: JSON.stringify(journey) }
                      }
                    : journey.status === JourneyStatusEnum.PENDING 
                      ? `/journey-success?status=pending&id=${journey.id}&title=${encodeURIComponent(journey.title)}&photo=${encodeURIComponent(journey.photo || '')}`
                      : `/journey/${journey.id}`
                } 
                key={journey.id} 
                className="block"
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