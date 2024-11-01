"use client";
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, MapPinIcon } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation';
const filters = [
  { id: 'bayc', icon: '/proofs/bayc-nft.png', color: 'bg-black' },
  { id: 'ape', icon: '/proofs/ape-holder.png', color: 'bg-blue-500' },
  { id: 'ethglobal', icon: '/proofs/ethglobal-attendee.png', color: 'bg-gray-700' },
  { id: 'poap', icon: '/proofs/poap-icon.png', color: 'bg-blue-300' },
  { id: 'nouns', icon: '/proofs/nouns-icon.png', color: 'bg-pink-300' },
  { id: 'talent', icon: '/proofs/talent-icon.png', color: 'bg-yellow-500' },
  { id: 'worldid', icon: '/proofs/world-id-icon.png', color: 'bg-red-500' },
]

export default function JourneyCreateComponent() {
  const [fromDate, setFromDate] = useState<Date>()
  const [toDate, setToDate] = useState<Date>()
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const router = useRouter();

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    )
  }

  const goToPreviewCreate = () => {
    console.log("goToPreviewCreate");
    router.push('/journey-preview');
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Create a Journey</h1>
      
      <div className="space-y-4 items-center justify-center">
        <div>
          <Label htmlFor="journeyTitle">Journey Title</Label>
          <Input id="journeyTitle" placeholder="Journey Title" />
        </div>

        <div>
          <Label htmlFor="where">Where</Label>
          <div className="relative">
            <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input id="where" placeholder="Where" className="pl-10" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>From</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromDate ? format(fromDate, "PPP") : <span>Select a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>To</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {toDate ? format(toDate, "PPP") : <span>Select a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="maxBudget">Max Budget per Nomad</Label>
            <Input id="maxBudget" placeholder="USDC" />
          </div>
          <div>
            <Label htmlFor="maxNomads">Share with max. of...</Label>
            <Input id="maxNomads" placeholder="# Nomads" />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" placeholder="Description" className="h-24" />
        </div>

        <div>
          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
            Load photo
          </Button>
        </div>

        <div>
          <Label htmlFor="optionalQuestion">Optional questions</Label>
          <Input id="optionalQuestion" placeholder="Example: What makes you the perfect candidate?" />
        </div>

        <div>
          <Label>Filters</Label>
          <div className="grid grid-cols-8 gap-2 mt-2">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                variant="outline"
                className={`p-1 aspect-square ${selectedFilters.includes(filter.id) ? 'ring-2 ring-orange-500' : ''}`}
                onClick={() => toggleFilter(filter.id)}
              >
                <div className={`w-full h-full rounded-md ${filter.color} flex items-center justify-center`}>
                  <img src={filter.icon} alt={filter.id} className="w-14 h-8" />
                </div>
              </Button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Tap once to activate a Requested Proof. Tap twice to make it mandatory 🔒
          </p>

        </div>


        <div  className="flex items-center justify-center">
        <Button 
          className="w-full max-w-[230px] my-4 bg-[#ff671e] hover:bg-orange-500 text-black text-xl py-8 rounded-xl shadow-xl border border-gray-600 mx-auto"
            onClick={goToPreviewCreate}
          >
          Preview & Create
          </Button>

        </div>


      </div>
    </div>
  )
}
