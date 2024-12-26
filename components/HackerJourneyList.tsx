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

// Define the structure of a hacker house
interface HackerHouse {
  id: number
  name: string
  location: string
  startDate: string
  endDate: string
  status: 'Active' | 'Upcoming' | 'Finished' | 'Cancelled'
  rating: number
  image: string
}


export default function HackerJourneyListComponent() {
  const [houses, setHouses] = useState<HackerHouse[]>([])
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { didToken, publicAddress,isAuthenticated } = useUser()

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
           const journeys = response.data.journeys || [];
           setHouses(journeys);
           if (journeys.length > 0) {
             sortHouses(sortBy, journeys);
           }
         }
       } catch (err) {
         setError(err instanceof Error ? err.message : 'An error occurred');
       } finally {
         setIsLoading(false);
       }
     }
 
     fetchHouses();
   }, [didToken, publicAddress]);

  const sortHouses = (by: 'date' | 'status', housesToSort = houses) => {
    setSortBy(by)
    const sorted = [...housesToSort].sort((a, b) => {
      if (by === 'date') {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      } else {
        const statusOrder = ['Active', 'Upcoming', 'Finished', 'Cancelled']
        return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
      }
    })
    setHouses(sorted)
  }
  
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

  const getStatusColor = (status: HackerHouse['status']) => {
    switch (status) {
      case 'Active': return 'bg-green-500'
      case 'Upcoming': return 'bg-orange-500'
      case 'Finished': return 'bg-gray-500'
      case 'Cancelled': return 'bg-red-500'
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
            <DropdownMenuItem onClick={() => sortHouses('date')}>
              Date {sortBy === 'date' && '✓'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => sortHouses('status')}>
              Status {sortBy === 'status' && '✓'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {houses.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No journeys found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {houses.map((house) => (
            <Link href={`/house-detail/`} key={house.id} className="block">
              <div className="rounded-lg overflow-hidden shadow-lg">
                <div className="relative h-28">
                  <Image
                    src={house.image}
                    alt={house.name}
                    layout="fill"
                    objectFit="cover"
                    style={{ zIndex: -1 }}
                  />

                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h2 className="text-white text-lg font-semibold">#{house.id} {house.name}</h2>
                        <p className="text-white text-md">{new Date(house.startDate).toLocaleDateString()} - {new Date(house.endDate).toLocaleDateString()}</p>
                      </div>
                      <ChevronRight className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(house.status)}`}>
                        {house.status}
                      </span>
                      <span className="bg-white text-black px-2 py-1 rounded-full text-xs font-semibold">
                        {house.rating}/10
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}