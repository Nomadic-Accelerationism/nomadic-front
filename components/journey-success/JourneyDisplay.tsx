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
    <div className="clay-surface clay-tone-white mx-auto my-8 w-[calc(100%_-_2rem)] max-w-md p-6">
      <h1 className="text-2xl font-bold text-center mb-4">
        {isPending 
          ? `Application to ${journey.title} sent,thank you!`
          : `Your Journey #${journey.id} ${journey.title} was created`
        }
      </h1>

      <div className="clay-image-frame relative mb-5 h-48 w-full bg-clay-peach">
        <Image
          src={journey.photo || '/placeholder.svg'}
          alt={journey.title}
          fill
          className="object-contain"
          priority
        />
      </div>

      <div className="mb-6 text-center text-clay-muted">
        <p>
        {isPending 
          ? "Watch closely for the status of your application in My Journeys, you'll have news soon"
          : "Please wait a few hours, your Journey is being reviewed for your security and the security of the ones using the platform."
        }
        </p>

        {!isPending && (
          <p className="mt-4">
            If you have any questions please send a XMTP message to nacc.eth
          </p>
        )}
      </div>

      <div className="flex items-center justify-center mb-6">
        <Button 
          variant="clayPrimary"
          size="clay"
          className="w-full max-w-[260px] text-lg"
          onClick={() => router.push('/hacker-journeys')}
        >
          LFG
        </Button>
      </div>

      <div className="text-center">
        <button
          onClick={onCancel}
          className="inline-flex min-h-11 items-center rounded-lg px-3 font-semibold text-clay-muted underline underline-offset-4 focus-visible:outline focus-visible:outline-3 focus-visible:outline-clay-ink"
        >
          Cancel journey
        </button>
      </div>
    </div>
  )
}
