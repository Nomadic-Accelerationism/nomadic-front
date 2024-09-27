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
}: HackerHouseDetailProps = {
  number: '16',
  location: 'Bangkok',
  name: 'STARKNET',
  description: "Join STARKNET's Hacker House in Bangkok! Collaborate with top tech talents in a vibrant, creative environment. Don't miss this unique opportunity!",
  price: '3000 USDC',
  startDate: '10/11/24',
  endDate: '20/11/24',
  imageUrl: '/images/house-bangkok.png?height=250&width=400'
}) {
  return (
      <div className="container mx-auto px-4 my-4">
          <h2 className="text-2xl font-bold mt-4 mb-4 px-4">#{number} {location} {name}</h2>
          <div className="flex justify-between items-center mb-6 bg-black rounded-xl overflow-hidden shadow-lg mx-4">
              <div className="w-7/12 relative h-48 md:h-auto">
                  <Image
                      src={imageUrl}
                      alt={`${location} ${name} Hacker House`}
                      layout="fill"
                      objectFit="cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 flex justify-between items-center">
                      <span className="font-bold text-xs">{price}</span>
                      <div className="flex items-center text-xs">
                          {/* <CalendarIcon className="w-4 h-4 mr-1" /> */}
                          <span>{startDate} - {endDate}</span>
                      </div>
                  </div>
              </div>
              <div className="w-5/12 p-4 bg-blue-50">
                  <p className="text-gray-700 mb-4 text-xs">{description}</p>
                  <div className="flex items-center text-gray-500 text-xs">
                      <MapPinIcon className="w-4 h-4 mr-1" />
                      <span>{location}</span>
                  </div>
              </div>
          </div>
      </div>
  )
}