"use client"

import React, { useState,useEffect } from 'react'
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



export default function HackerJourneyListComponent() {
  const [journeys, setJourneys] = useState<Journey[]>([])
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { didToken, publicAddress,isAuthenticated,userMetadata } = useUser()

  const sortJourneys = (by: 'date' | 'status', journeysToSort = journeys) => {
    setSortBy(by)
    const sorted = [...journeysToSort].sort((a, b) => {
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
    setJourneys(sorted)
  }

  useEffect(() => {
    if (!isAuthenticated) {
      console.log("not authenticated")
      return;
    }


    const fetchHouses = async () => {
       try {
         const response = await axios.post('/api/auth/get-hacker-journeys', {
           didToken,
           publicAddress
         });

         if (response.data) {
           const fetchedJourneys = response.data.journeys || [];
           console.log(fetchedJourneys);
           setJourneys(fetchedJourneys);
           if (fetchedJourneys.length > 0) {
             sortJourneys(sortBy, fetchedJourneys);
           }
         }
       } catch (err) {
         setError(err instanceof Error ? err.message : 'An error occurred');
       } finally {
         setIsLoading(false);
       }
     }

     fetchHouses();
   }, [didToken, publicAddress, isAuthenticated, sortBy, sortJourneys]);

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
          {error}
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
        <h1 className="text-2xl font-bold">My Journeys</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => sortJourneys('date')}>
              Date {sortBy === 'date' && '✓'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => sortJourneys('status')}>
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
                  <Image
                    src={journey.photo || '/placeholder.svg'}
                    alt={journey.title}
                    layout="fill"
                    objectFit="cover"
                    style={{ zIndex: -1 }}
                  />

                  <div className="p-4">
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