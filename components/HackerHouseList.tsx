"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, SlidersHorizontal } from 'lucide-react'
import { Button } from "@/components/ui/button"
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

// Mock data (replace this with your JSON data)
const hackerHouses: HackerHouse[] = [
  {
    id: 21,
    name: "Bangkok Talent Protocol",
    location: "Bangkok",
    startDate: "2024-11-11",
    endDate: "2024-11-29",
    status: "Active",
    rating: 7,
    image: "/images/house-bangkok.png?height=250&width=400"
  },
  {
    id: 1,
    name: "Rome NOUNS",
    location: "Rome",
    startDate: "2024-12-01",
    endDate: "2024-12-22",
    status: "Upcoming",
    rating: 5,
    image: "/images/house-image-02.png?height=250&width=400"
  },
  {
    id: 24,
    name: "Barcelona APES",
    location: "Barcelona",
    startDate: "2024-03-15",
    endDate: "2024-03-22",
    status: "Finished",
    rating: 8,
    image: "/images/house-image-03.png?height=250&width=400"
  },
  {
    id: 25,
    name: "Barcelona APES",
    location: "Barcelona",
    startDate: "2024-07-08",
    endDate: "2024-07-16",
    status: "Cancelled",
    rating: 0,
    image: "/images/house-image-04.png?height=250&width=400"
  }
]

export default function HackerHouseListComponent() {
  const [houses, setHouses] = useState(hackerHouses)
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date')

  const sortHouses = (by: 'date' | 'status') => {
    setSortBy(by)
    const sorted = [...houses].sort((a, b) => {
      if (by === 'date') {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      } else {
        const statusOrder = ['Active', 'Upcoming', 'Finished', 'Cancelled']
        return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
      }
    })
    setHouses(sorted)
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
    <div className="clay-surface clay-tone-white container mx-auto my-4 px-5 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Hacker Houses</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="clayIcon" aria-label="Sort Hacker Houses">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="clay-surface clay-tone-white rounded-[22px] border-none">
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

      <div className="space-y-4">
        {houses.map((house) => (
          <Link
            href="/house-detail/"
            key={house.id}
            className="clay-image-frame clay-interactive block bg-clay-peach focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-clay-ink"
          >
            <div className="relative h-32 overflow-hidden rounded-[22px]">
              <Image
                src={house.image}
                alt={house.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
              <div className="relative z-10 p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">#{house.id} {house.name}</h2>
                    <p className="text-sm font-medium text-white">{new Date(house.startDate).toLocaleDateString()} - {new Date(house.endDate).toLocaleDateString()}</p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center justify-between">
                  <span className={`clay-chip px-2 py-1 text-xs font-semibold text-white ${getStatusColor(house.status)}`}>
                    {house.status}
                  </span>
                  <span className="clay-chip bg-clay-white px-2 py-1 text-xs font-bold text-clay-ink">
                    {house.rating}/10
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
