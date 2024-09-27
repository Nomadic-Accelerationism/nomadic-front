import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { ChevronRight, Filter, MoreHorizontal } from 'lucide-react'
import Image from 'next/image'

import { Participant } from "@/interfaces/Participant"
import { ParticipantVerification } from "@/interfaces/ParticipantVerification"

const verifications: ParticipantVerification[] = [
//   { name: 'GitHub', icon: '/placeholder.svg?height=24&width=24' },
//   { name: 'LinkedIn', icon: '/placeholder.svg?height=24&width=24' },
//   { name: 'Twitter', icon: '/placeholder.svg?height=24&width=24' },
//   { name: 'Portfolio', icon: '/placeholder.svg?height=24&width=24' },
  { name: "$APE Holder", icon: "/proofs/ape-holder.png" },
  { name: "Bored Ape Yatch Club NFT Holder", icon: "/proofs/bayc-nft.png" },
  { name: "ETHGlobal Attendee", icon: "/proofs/ethglobal-attendee.png" },
  { name: "I've met Patricio POAP", icon: "/proofs/poap-icon.png" },
  { name: "$NOUNS Holder", icon: "/proofs/nouns-icon.png" },
  { name: "Talent Protocol Passport", icon: "/proofs/talent-icon.png" },
  { name: "World ID Human Verification", icon: "/proofs/world-id-icon.png" },

]

const participants: Participant[] = [
//   { id: 1, name: 'Confirmed', status: 'Confirmed', points: 7, maxPoints: 10 },
  { id: 2, name: '@Llamame', status: 'Confirmed', points: 7, maxPoints: 10, verifications: [verifications[0], verifications[1]] },
  { id: 3, name: '@victorxva', status: 'Confirmed', points: 7, maxPoints: 10, verifications: [verifications[3], verifications[4]] },
  { id: 4, name: 'Approved', status: 'Approved', points: 6, maxPoints: 10 },
//   { id: 5, name: 'Pending', status: 'Pending', points: 1, maxPoints: 10 },
  { id: 6, name: '#8', status: 'Pending', points: 1, maxPoints: 10, verifications: verifications },
//   { id: 7, name: 'Not Selected', status: 'Not Selected', points: 2, maxPoints: 10 },
  { id: 8, name: '#11', status: 'Not Selected', points: 2, maxPoints: 10, verifications: [verifications[0], verifications[1], verifications[2]] },
  { id: 9, name: '#7', status: 'Not Selected', points: 2, maxPoints: 10, verifications: [verifications[0]] },
]

const statusColors = {
  'Confirmed': 'bg-gradient-to-r from-green-400 to-green-100',
  'Approved': 'bg-gradient-to-r from-orange-400 to-orange-100',
  'Pending': 'bg-gradient-to-r from-yellow-400 to-yellow-100',
  'Not Selected': 'bg-gradient-to-r from-gray-400 to-gray-100',
}

export default function HackerHouseParticipantsComponent() {
  const [filteredParticipants, setFilteredParticipants] = useState(participants)
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [pointsFilter, setPointsFilter] = useState([0, 10])

  const handleFilterChange = () => {
    const filtered = participants.filter(participant => 
      (statusFilter.length === 0 || statusFilter.includes(participant.status)) &&
      (participant.points >= pointsFilter[0] && participant.points <= pointsFilter[1])
    )
    setFilteredParticipants(filtered)
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4 mx-6">
        <h1 className="text-2xl font-bold">Participants</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Filter participants">
              <Filter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Status</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(statusColors).map((status) => (
                    <Button
                      key={status}
                      variant="outline"
                      size="sm"
                      className={statusFilter.includes(status) ? 'bg-primary text-primary-foreground' : ''}
                      onClick={() => {
                        setStatusFilter(prev => 
                          prev.includes(status) 
                            ? prev.filter(s => s !== status)
                            : [...prev, status]
                        )
                      }}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Points</h3>
                <Slider
                  min={0}
                  max={10}
                  step={1}
                  value={pointsFilter}
                  onValueChange={setPointsFilter}
                />
                <div className="flex justify-between mt-2">
                  <span>{pointsFilter[0]}</span>
                  <span>{pointsFilter[1]}</span>
                </div>
              </div>
              <Button onClick={handleFilterChange}>Apply Filters</Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-2 mx-4">
        {filteredParticipants.map((participant) => (
          <div
            key={participant.id}
            className={`flex items-center justify-between rounded-lg border border-gray-700 overflow-hidden ${statusColors[participant.status]}`}
          >
            <div className="flex items-center space-x-2 pl-3 pr-4 flex-grow">
              <MoreHorizontal className="h-4 w-4" />
              <span className="text-xs font-medium">{participant.name}</span>
              {participant.verifications && (
                <div className="flex space-x-1">
                  {participant.verifications.map((verification, index) => (
                    <Image
                      key={index}
                      src={verification.icon}
                      alt={`${verification.name} verification`}
                      width={30}
                      height={30}
                      className="rounded-sm"
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center bg-black text-white py-3 pl-2 pr-1">
              <span className="font-bold text-xs">
                {participant.points}/{participant.maxPoints}
              </span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}