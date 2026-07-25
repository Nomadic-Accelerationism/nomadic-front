import * as React from "react"
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Journey } from '@/interfaces/Journey'
import { MapPin } from 'lucide-react'
import { format } from "date-fns"
import Image from 'next/image'
import { ProofNameEnum } from '@/interfaces/ProofItem'
import { useRouter } from 'next/navigation'

interface JourneyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  journey: Journey;
  onApply: () => void;
}

export function JourneyDetailModal({ isOpen, onClose, journey, onApply }: JourneyDetailModalProps) {
  const router = useRouter();

  const getProofIcon = (proof: ProofNameEnum): string => {
    const proofName = ProofNameEnum[proof] as keyof typeof ProofNameEnum;
    const proofIcons: Record<ProofNameEnum, string> = {
      [ProofNameEnum.BAYC_NFT]: 'bayc-nft.png',
      [ProofNameEnum.APE_HOLDER]: 'ape-holder.png',
      [ProofNameEnum.ETHGLOBAL_HACKER]: 'ethglobal-attendee.png',
      [ProofNameEnum.PATRICIO_POAP]: 'poap-icon.png',
      [ProofNameEnum.NOUNS_NFT]: 'nouns-icon.png',
      [ProofNameEnum.TALENT_PROTOCOL_PASSPORT]: 'talent-icon.png',
      [ProofNameEnum.WORLD_ID_POH]: 'world-id-icon.png',
      [ProofNameEnum.ETHGLOBAL_VOLUNTEER]: 'ethglobal-attendee.png',
    };
    return `/proofs/${proofIcons[proofName] || 'default-icon.png'}`;
  };

  const handleApply = () => {
    const journeyData = encodeURIComponent(JSON.stringify(journey));
    router.push(`/journey-apply?journeyData=${journeyData}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogOverlay className="bg-black/50 fixed inset-0" />
      <DialogContent className="clay-surface clay-tone-white fixed left-1/2 top-1/2 max-h-[90vh] w-7/8 max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[32px] border-none p-8">
        <div className="w-full">
          <h1 className="text-2xl font-bold text-center mb-2">Journey Details</h1>
          <h2 className="text-xl font-semibold text-center mb-4">{journey.title}</h2>

          <div className="flex items-center space-x-2 mb-4">
            <MapPin size={16} className="text-gray-500" />
            <span className="text-sm underline">{journey.location}</span>
          </div>

          <div className="clay-image-frame relative mb-5 w-full bg-clay-peach" style={{ paddingTop: '56.25%' }}>
            <Image 
              src={journey.photo || '/placeholder.svg'} 
              alt="Journey" 
              layout="fill"
              objectFit="cover"
              className="absolute left-1.5 top-1.5 rounded-[22px]"
            />
          </div>

          <div className="mb-4">
            <p className="text-sm whitespace-pre-wrap">{journey.description}</p>
          </div>

          {((journey.requiredProofs && journey.requiredProofs.length > 0) || 
            (journey.customProofs && journey.customProofs.length > 0)) && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Required Proofs:</h3>
              <div className="grid grid-cols-3 gap-4">
                {[...(journey.requiredProofs || []), ...(journey.customProofs || [])].map((proof, index) => {
                  const proofEnum = proof as ProofNameEnum;
                  const isRequired = journey.requiredProofs?.includes(proofEnum);

                  return (
                    <div 
                      key={index} 
                      className="clay-chip relative flex h-12 w-12 items-center justify-center bg-clay-sky"
                    >
                      <Image 
                        src={getProofIcon(proofEnum)} 
                        alt={String(proof)}
                        width={48}
                        height={48}
                        className="w-12 h-12 p-2"
                      />
                      {isRequired && (
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
                          <Image
                            src="/icons/lock.png"
                            alt="Required"
                            width={16}
                            height={16}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 my-6"></div>

          <div className="mb-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <h3 className="font-bold text-lg">Journey Budget</h3>
              <span className="text-[#ff671e] font-semibold ml-2">{journey.budget} USDC</span>
            </div>
            <p className="text-sm text-gray-600">
              This is the the budget that the house has compromised for the entry stay for the X time / This
              is the budget you should pay for the Journey
            </p>
          </div>

          <div className="text-center mb-6">
            <p className="font-bold">
              {journey.startDate ? format(new Date(journey.startDate), "PPP") : "Not Set"}
              {" - "}
              {journey.endDate ? format(new Date(journey.endDate), "PPP") : "Not Set"}
            </p>
          </div>

          <div className="flex justify-center">
            <Button 
              variant="clayPrimary"
              size="clay"
              onClick={handleApply}
              className="px-12"
            >
              Apply
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
