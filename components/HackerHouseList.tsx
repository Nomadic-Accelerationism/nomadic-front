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
    <div className="container mx-auto px-4 my-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Hacker Houses</h1>
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

      <div className="space-y-4">
        {houses.map((house) => (
          <Link href={`/house/${house.id}`} key={house.id} className="block">
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

    </div>
  )
}