import Image from 'next/image'
import { CalendarIcon, MapPinIcon } from 'lucide-react'

interface HackerHouseDetailProps {
  number: string
  location: string
  name: string
  description: string
  price: string
  startDate: string
  endDate: string
  imageUrl: string
}

export default function HackerHouseDetailComponent({
  number,
  location,
  name,
  description,
  price,
  startDate,
  endDate,
  imageUrl
}: HackerHouseDetailProps) {
  return (
    <div className="clay-page mx-auto w-full max-w-md p-6">
      <h2 className="clay-surface clay-tone-butter mb-5 px-5 py-4 text-2xl font-bold text-clay-ink">
        #{location} {name}
      </h2>
      <div className="clay-surface clay-tone-white flex items-stretch justify-between overflow-hidden rounded-[28px]">
        <div className="w-7/12 relative">
          <Image
            src={imageUrl || '/placeholder.svg'}
            alt={`${location} ${name}`}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-black/80 p-2 text-white">
            <span className="font-bold text-sm">{price}</span>
            <div className="flex items-center text-sm">
              <CalendarIcon className="w-4 h-4 mr-1" />
              <span>{startDate} - {endDate}</span>
            </div>
          </div>
        </div>

        <div className="w-5/12 bg-clay-peach p-4">
          <p className="mb-4 text-sm text-clay-muted">{description}</p>
          <div className="flex items-center text-sm text-clay-muted">
            <MapPinIcon className="w-4 h-4 mr-1" />
            <span>{location}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
