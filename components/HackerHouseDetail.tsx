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
    <div className="w-full max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4 text-black">
        #{location} {name}
      </h2>
      <div className="flex justify-between items-stretch rounded-xl overflow-hidden shadow-lg bg-white">
        <div className="w-7/12 relative">
          <Image
            src={imageUrl || '/placeholder.svg'}
            alt={`${location} ${name}`}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 flex justify-between items-center">
            <span className="font-bold text-sm">{price}</span>
            <div className="flex items-center text-sm">
              <CalendarIcon className="w-4 h-4 mr-1" />
              <span>{startDate} - {endDate}</span>
            </div>
          </div>
        </div>

        <div className="w-5/12 p-4 bg-gradient-to-r from-[#ff671e] to-white">
          <p className="text-gray-700 mb-4 text-sm">{description}</p>
          <div className="flex items-center text-gray-500 text-sm">
            <MapPinIcon className="w-4 h-4 mr-1" />
            <span>{location}</span>
          </div>
        </div>
      </div>
    </div>
  )
}