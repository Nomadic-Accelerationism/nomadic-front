import { Button } from "@/components/ui/button"
import { MapPin } from 'lucide-react'
import {JourneyPreviewProps} from '@/interfaces/Journey';
import { format} from "date-fns"
import { ProofNameEnum } from '@/interfaces/ProofItem';
import {useUser} from '@/contexts/UserContext';
import axios from "axios";
import { useRouter } from 'next/navigation';
import { JourneyStatusEnum } from '@/interfaces/Journey';
import { SuccessfulModal } from "./modals/successful-modal";
import { useState } from 'react';
import Image from 'next/image';

export default function JourneyPreviewComponent({
  title,
  socialMedia = [
    { platform: 'telegram', username: '@Llamame' },
    { platform: 'twitter', username: '@Llamame' }
  ],
  location,
  startDate,
  endDate,
  budget,
  guestCapacity,
  requiredProofs,
  customProofs,
  optionalQuestion,
  photo,
  description,
  onEdit,
  onConfirm
}: JourneyPreviewProps) {
  const { didToken,publicAddress,isAuthenticated } = useUser();
  const router = useRouter();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const isEdit = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get('isEdit') === 'true'
    : false;
  const compressImage = async (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = document.createElement('img'); 
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
  
        const maxWidth = 600;
        const maxHeight = 400;
        let width = img.width;
        let height = img.height;
  
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
  
        canvas.width = width;
        canvas.height = height;
  
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
    });
  };

  const handleConfirm = async () => {
    if (!isAuthenticated) {
      console.log("not authenticated")
      return;
    }

    try {
      let compressedPhoto = photo;
      if (photo && !photo.startsWith('/placeholder')) {
        compressedPhoto = await compressImage(photo);
      }

      const urlParams = new URLSearchParams(window.location.search);
      const formDataParam = urlParams.get('formData');
      const parsedFormData = formDataParam ? JSON.parse(formDataParam) : {};

      const journeyData = {
        id: parsedFormData.id,
        title,
        location,
        description,
        guestCapacity: Number(guestCapacity),
        budget: Number(budget),
        status: JourneyStatusEnum.PENDING,
        requiredProofs: requiredProofs.map(proof => 
          typeof proof === 'number' ? ProofNameEnum[proof] : proof
        ), 
        customProofs: customProofs?.map(proof => 
          typeof proof === 'number' ? ProofNameEnum[proof] : proof
        ) || [],
        startDate,
        finishDate: endDate,
        optionalQuestion,
        photo: compressedPhoto,
        creatorAddress: publicAddress
      };

      const endpoint = isEdit ? '/api/auth/update-journey-edit' : '/api/auth/create-journey';

      const response = await axios.post(endpoint, {
        didToken,
        publicAddress,
        journey: journeyData
      });

      if (response.data) {
        localStorage.setItem('createdJourney', JSON.stringify(journeyData));
        if (isEdit) {
          setShowSuccessModal(true)
        } else {
          router.push(`/journey-success?id=${response.data.journey.id}`);
        }
      }
    } catch (error) {
      console.error('Error with journey:', error);
    }
  };

  const getProofIcon = (proof: ProofNameEnum): string => {
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
    return `/proofs/${proofIcons[proof] || 'default-icon.png'}`;
  };

  const getProofColor = (proof: ProofNameEnum): string => {
    const proofColors: Record<ProofNameEnum, string> = {
      [ProofNameEnum.BAYC_NFT]: 'bg-black',
      [ProofNameEnum.APE_HOLDER]: 'bg-blue-500',
      [ProofNameEnum.ETHGLOBAL_HACKER]: 'bg-gray-700',
      [ProofNameEnum.PATRICIO_POAP]: 'bg-blue-300',
      [ProofNameEnum.NOUNS_NFT]: 'bg-pink-300',
      [ProofNameEnum.TALENT_PROTOCOL_PASSPORT]: 'bg-yellow-500',
      [ProofNameEnum.WORLD_ID_POH]: 'bg-red-500',
      [ProofNameEnum.ETHGLOBAL_VOLUNTEER]: 'bg-gray-700', 
    };
    return proofColors[proof] || 'bg-gray-200';
  };
  return (
      <>
        <div className="clay-page mx-auto min-h-screen w-full max-w-md p-6">
          <div className="clay-surface clay-tone-white px-5 py-6">
          <h1 className="text-center text-3xl font-bold">Preview your Journey</h1>
          <h2 className="text-xl font-semibold text-center mb-4">{title}</h2>

          {/* <p className="text-sm mb-2">Your social media to be contacted:</p>
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
          </div> */}

          <div className="flex items-center space-x-2 mb-4">
            <MapPin size={16} className="text-clay-muted" />
            <span className="text-sm underline">{location}</span>
          </div>

          <div className="clay-surface clay-tone-butter mb-5 space-y-1 rounded-[22px] px-4 py-4">
            <p className="text-sm font-semibold text-clay-ink">Journey first day: {startDate ? format(startDate, "PPP") : "Not Set"}</p>
            <p className="text-sm font-semibold text-clay-ink">Journey last day: {endDate ? format(endDate, "PPP") : "Not Set"}</p>
            <p className="text-sm font-semibold text-clay-ink">Max Budget per Nomad: {budget} USDC</p>
            <p className="text-sm font-semibold text-clay-ink">Max Nomads in the Journey: {guestCapacity} Nomads</p>
          </div>

          <div className="mb-4">
            {(requiredProofs.length > 0 || (customProofs && customProofs.length > 0)) && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Requested Proofs:</h3>
                <div className="flex flex-wrap gap-2">
                  {[...requiredProofs, ...(customProofs || [])].map((proof, index) => (
                    <div 
                      key={index} 
                      className={`clay-chip relative flex h-12 w-12 items-center justify-center ${getProofColor(proof)}`}
                    >
                      <Image 
                        src={getProofIcon(proof)} 
                        alt={String(proof)} 
                        width={48}
                        height={48}
                        className="w-12 h-12"
                      />
                      {requiredProofs.includes(proof) && (
                        <div className="absolute top-1 right-1">
                          <Image 
                            src="/icons/lock.png" 
                            alt="Required" 
                            width={16} 
                            height={16} 
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Question to be answered:</h3>
            <p className="text-sm">{optionalQuestion}</p>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Journey photo:</h3>
            <div className="clay-image-frame bg-clay-peach">
              <Image
                src={photo || "/placeholder.svg"}
                alt="Journey"
                width={720}
                height={405}
                unoptimized
                className="h-auto w-full rounded-[22px]"
              />
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Journey description:</h3>
            <p className="text-sm whitespace-pre-wrap">{description}</p>
          </div>

          <div className="flex justify-between mt-6">
            <Button 
              variant="claySecondary"
              size="clay"
              onClick={onEdit}
              className="w-[48%]"
            >
              Edit
            </Button>
            <Button 
              variant="clayPrimary"
              size="clay"
              onClick={handleConfirm}
              className="w-[48%]"
            >
              Confirm
            </Button>
          </div>
          </div>
        </div>

        <SuccessfulModal 
          open={showSuccessModal}
          onOpenChange={(open) => {
            setShowSuccessModal(open);
            if (!open) {
              router.push('/hacker-journeys');
            }
          }}
        />
      </>
    )
  }
