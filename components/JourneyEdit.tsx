"use client";
import { useState,useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, MapPinIcon } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation';
import { Journey, JourneyFormData, JourneyStatusEnum } from '@/interfaces/Journey';
import { ProofNameEnum } from '@/interfaces/ProofItem';
import { useUser } from '@/contexts/UserContext'
import Image from 'next/image'
import { useProofSelection } from '@/hooks/useProofSelection';
import { ProofSelector } from '@/components/ProofSelector';

const filters = [
  { id: 'bayc', icon: '/proofs/bayc-nft.png', color: 'bg-black', proofEnum: ProofNameEnum.BAYC_NFT },
  { id: 'ape', icon: '/proofs/ape-holder.png', color: 'bg-blue-500' , proofEnum : ProofNameEnum.APE_HOLDER },
  { id: 'ethglobal', icon: '/proofs/ethglobal-attendee.png', color: 'bg-gray-700' , proofEnum:  ProofNameEnum.ETHGLOBAL_HACKER},
  { id: 'poap', icon: '/proofs/poap-icon.png', color: 'bg-blue-300' , proofEnum: ProofNameEnum.PATRICIO_POAP},
  { id: 'nouns', icon: '/proofs/nouns-icon.png', color: 'bg-pink-300', proofEnum: ProofNameEnum.NOUNS_NFT },
  { id: 'talent', icon: '/proofs/talent-icon.png', color: 'bg-yellow-500' , proofEnum: ProofNameEnum.TALENT_PROTOCOL_PASSPORT},
  { id: 'worldid', icon: '/proofs/world-id-icon.png', color: 'bg-red-500' , proofEnum: ProofNameEnum.WORLD_ID_POH},
]

interface JourneyEditProps {
  journey: Journey;
}

export default function JourneyEditComponent({ journey }: JourneyEditProps) {
  const { publicAddress } = useUser();
  const { formData: proofData, handleProofClick, isProofRequired, isProofCustom } = useProofSelection({
    initialRequiredProofs: journey.requiredProofs,
    initialCustomProofs: journey.customProofs
  });

  const [formData, setFormData] = useState<JourneyFormData>({
    id: journey.id,
    title: journey.title,
    location: journey.location,
    description: journey.description,
    guestCapacity: journey.guestCapacity.toString(),
    budget: journey.budget.toString(),
    startDate: journey.startDate ? new Date(journey.startDate) : undefined,
    finishDate: journey.endDate ? new Date(journey.endDate) : undefined, 
    requiredProofs: proofData.requiredProofs,
    customProofs: proofData.customProofs,
    status: journey.status,
    optionalQuestion: journey.optionalQuestion || '',
    photo: journey.photo || '',
    creatorAddress: journey.creatorAddress
  });

  const router = useRouter();
  
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      requiredProofs: proofData.requiredProofs,
      customProofs: proofData.customProofs
    }));
  }, [proofData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({
          ...prev,
          photo: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      photo: ''
    }));
  };

  const goToPreviewEdit = () => {
    if (typeof window !== 'undefined') {
      if (formData.photo) {
        localStorage.setItem('journeyTempPhoto', formData.photo);
      }

      const convertedProofs = formData.requiredProofs.map(proofEnum =>
        ProofNameEnum[proofEnum] as string
      );

      const serializedFormData = {
        ...formData,
        id: journey.id,
        photo: undefined,
        startDate: formData.startDate?.toISOString(),
        finishDate: formData.finishDate?.toISOString(),
        creatorAddress: publicAddress,
        requiredProofs: proofData.requiredProofs,
        customProofs: proofData.customProofs,
        isEdit: true
      }
      router.push(`/journey-preview?formData=${encodeURIComponent(JSON.stringify(serializedFormData))}&isEdit=true`);
    }
  }

  return (
    <div className="clay-page mx-auto min-h-screen max-w-md p-6">
      <h1 className="clay-surface clay-tone-lilac mb-7 px-6 py-6 text-center text-3xl font-bold">Edit Journey</h1>

      <div className="clay-surface clay-tone-white space-y-5 px-5 py-6">
        <div>
          <Label htmlFor="title">Journey Title</Label>
          <Input 
            variant="clay"
            id="title" 
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Journey Title" 
            className={formData.title ? "bg-clay-white" : ""}
          />
        </div>

        <div>
          <Label htmlFor="location">Where</Label>
          <div className="relative">
            <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input 
              variant="clay"
              id="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Where" 
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>From</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="claySecondary" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.startDate ? format(formData.startDate, "PPP") 
                    : <span>Select a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="clay-surface clay-tone-white w-auto rounded-[22px] border-none p-0">
                <Calendar 
                  mode="single" 
                  selected={formData.startDate}
                  onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date}))}
                  initialFocus 
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>To</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="claySecondary" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.finishDate ? format(formData.finishDate, "PPP") 
                    : <span>Select a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="clay-surface clay-tone-white w-auto rounded-[22px] border-none p-0">
                <Calendar 
                  mode="single" 
                  selected={formData.finishDate}
                  onSelect={(date) => setFormData(prev => ({...prev, finishDate: date}))}
                  initialFocus 
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="budget">Max Budget per Nomad</Label>
            <Input
              variant="clay"
              id="budget"
              value={formData.budget}
              onChange={handleInputChange}
              placeholder="USDC" 
            />
          </div>
          <div>
            <Label htmlFor="guestCapacity">Share with max. of...</Label>
            <Input 
              variant="clay"
              id="guestCapacity"
              value={formData.guestCapacity}
              onChange={handleInputChange}
              placeholder="# Nomads" 
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea 
            variant="clay"
            id="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Description" 
            className="h-28"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="file"
              id="photo-upload"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <Button 
              variant="claySecondary"
              size="clay"
              className="w-full bg-clay-sky"
              onClick={() => document.getElementById('photo-upload')?.click()}
            >
              {formData.photo ? 'Change photo' : 'Upload photo'}
            </Button>
          </div>
          {formData.photo && (
            <>
              <div className="relative w-16 h-16">
                <Image
                  src={formData.photo}
                  alt="Journey photo"
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <button
                onClick={handleRemoveImage}
                className="text-red-500 hover:text-red-700 text-sm underline"
              >
                Remove
              </button>
            </>
          )}
        </div>

        <div>
          <Label htmlFor="optionalQuestion">Optional questions</Label>
          <Input 
            variant="clay"
            id="optionalQuestion" 
            value={formData.optionalQuestion}
            onChange={handleInputChange}
            placeholder="Example: What makes you the perfect candidate?" 
          />
        </div>

        <div>
          <Label>Filters</Label>
          <ProofSelector
            filters={filters}
            onProofClick={handleProofClick}
            isProofRequired={isProofRequired}
            isProofCustom={isProofCustom}
          />
        </div>

        <div className="flex justify-between gap-4">
          <Button 
            variant="claySecondary"
            size="clay"
            className="my-4 w-full max-w-[230px]"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
          <Button 
            variant="clayPrimary"
            size="clay"
            className="my-4 w-full max-w-[230px]"
            onClick={goToPreviewEdit}
          >
            Preview
          </Button>
        </div>
      </div>
    </div>
  )
}
