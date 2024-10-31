'use client';

import { Button } from "@/components/ui/button"
import { MapPin } from 'lucide-react'

interface JourneyPreviewProps {
  title: string
  socialMedia: { platform: string; username: string }[]
  location: string
  startDate: string
  endDate: string
  budget: number
  maxNomads: number
  requiredProofs: string[]
  question: string
  photo: string
  description: string
  onEdit: () => void
  onConfirm: () => void
}

export default function JourneyPreviewComponent({
  title = "Bangkok Beer House",
  socialMedia = [
    { platform: 'telegram', username: '@Llamame' },
    { platform: 'twitter', username: '@Llamame' }
  ],
  location = "Bangkok conference center area,48966, Thailand...",
  startDate = "11 Nov 24",
  endDate = "17 Nov 24",
  budget = 400,
  maxNomads = 5,
  requiredProofs = ['ethereum', 'polygon', 'ens', 'lens', 'gitcoin', 'bored-ape', 'proof-of-humanity', 'optimism', 'female'],
  question = "What makes you the perfect candidate?",
  photo = "/placeholder.svg?height=300&width=400",
  description = "Lorem ipsum dolor sit amet consectetur...",
  onEdit = () => {},
  onConfirm = () => {}
}: JourneyPreviewProps) {
  const getProofIcon = (proof: string): string => {
    const proofIcons: Record<string, string> = {
      'bayc': 'bayc-nft.png',
      'ape': 'ape-holder.png',
      'ethglobal': 'ethglobal-attendee.png',
      'poap': 'poap-icon.png',
      'nouns': 'nouns-icon.png',
      'talent': 'talent-icon.png',
      'worldid': 'world-id-icon.png',
      // Add more mappings as needed
    }
    return proofIcons[proof] || 'default-icon.png'
  }

  const getProofColor = (proof: string): string => {
    const proofColors: Record<string, string> = {
      'bayc': 'bg-black',
      'ape': 'bg-blue-500',
      'ethglobal': 'bg-gray-700',
      'poap': 'bg-blue-300',
      'nouns': 'bg-pink-300',
      'talent': 'bg-yellow-500',
      'worldid': 'bg-red-500',
      // Add more mappings as needed
    }
    return proofColors[proof] || 'bg-gray-200'
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white p-6 rounded-lg">
      <h1 className="text-2xl font-bold text-center mb-2">Preview your Journey</h1>
      <h2 className="text-xl font-semibold text-center mb-4">{title}</h2>
      
      <p className="text-sm mb-2">Your social media to be contacted:</p>
      <div className="flex space-x-2 mb-4">
        {socialMedia.map((social, index) => (
          <div key={index} className="flex items-center border rounded-full px-3 py-1">
            {social.platform === 'telegram' && (
              <svg className="w-5 h-5 mr-2 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.07-.18-.04-.26-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.26-1.45-.4-1.4-.85.03-.22.46-.44 1.3-.66 5.09-2.22 8.49-3.68 10.19-4.4 1.62-.69 3.11-.32 3.25 1.31z"/>
              </svg>
            )}
            {social.platform === 'twitter' && (
              <svg className="w-5 h-5 mr-2 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"/>
              </svg>
            )}
            <span className="text-sm">{social.username}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <MapPin size={16} className="text-gray-500" />
        <span className="text-sm underline">{location}</span>
      </div>

      <div className="space-y-1 mb-4">
        <p className="text-sm text-orange-500">Journey first day: {startDate}</p>
        <p className="text-sm text-orange-500">Journey last day: {endDate}</p>
        <p className="text-sm text-orange-500">Max Budget per Nomad: {budget} USDC</p>
        <p className="text-sm text-orange-500">Max Nomads in the Journey: {maxNomads} Nomads</p>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Requested Proofs:</h3>
        <div className="flex flex-wrap gap-2">
          {requiredProofs.map((proof, index) => (
            <div 
              key={index} 
              className={`w-12 h-12 rounded-md flex items-center justify-center ${getProofColor(proof)}`}
            >
              <img 
                src={`/proofs/${getProofIcon(proof)}`} 
                alt={proof} 
                className="w-12 h-12"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Question to be answered:</h3>
        <p className="text-sm">{question}</p>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Journey photo:</h3>
        <img src={photo} alt="Journey" className="w-full rounded-lg" />
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Journey description:</h3>
        <p className="text-sm whitespace-pre-wrap">{description}</p>
      </div>

      <div className="flex justify-between mt-6">
        <Button 
          variant="outline" 
          onClick={onEdit}
          className="w-[48%] bg-gray-200 hover:bg-gray-300 text-black"
        >
          Edit
        </Button>
        <Button 
          onClick={onConfirm}
          className="w-[48%] bg-orange-500 hover:bg-orange-600 text-black"
        >
          Confirm
        </Button>
      </div>
    </div>
  )
}