import Image from 'next/image'
import { Journey } from '@/interfaces/Journey'
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'

interface JourneyDisplayProps {
  journey: Journey
  isPending: boolean
  onCancel: () => void
}

export function JourneyDisplay({ journey, isPending, onCancel }: JourneyDisplayProps) {
  const router = useRouter()

  return (
    <div className="w-full max-w-md mx-auto bg-white p-6 rounded-lg">
      <h1 className="text-2xl font-bold text-center mb-4">
        {isPending 
          ? `Application to ${journey.title} sent,thank you!`
          : `Your Journey #${journey.id} ${journey.title} was created`
        }
      </h1>

      <div className="relative h-48 w-full mb-4 rounded-lg overflow-hidden">
        <Image
          src={journey.photo || '/placeholder.svg'}
          alt={journey.title}
          fill
          className="object-contain"
          priority
        />
      </div>

      <p className="text-gray-600 text-center mb-6">
        {isPending 
          ? "Watch closely for the status of your application in My Journeys, you'll have news soon"
          : "Please wait a few hours, your Journey is being reviewed for your security and the security of the ones using the platform."
        }

        {!isPending && (
          <p className="mt-4">
            If you have any questions please send a XMTP message to nacc.eth
          </p>
        )}
      </p>

      <div className="flex items-center justify-center mb-6">
        <Button 
          className="w-full max-w-[230px] bg-[#ff671e] hover:bg-orange-500 text-black text-xl py-8 rounded-xl shadow-xl border border-gray-600 font-bold"
          onClick={() => router.push('/hacker-journeys')}
        >
          LFG
        </Button>
      </div>

      <div className="text-center">
        <button
          onClick={onCancel}
          className="text-gray-500 underline hover:text-gray-700"
        >
          Cancel journey
        </button>
      </div>
    </div>
  )
}