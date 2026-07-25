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
import { JourneyFormData, JourneyStatusEnum } from '@/interfaces/Journey';
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

export default function JourneyCreateComponent() {
  const { publicAddress } = useUser();
  const { formData: proofData, handleProofClick, isProofRequired, isProofCustom } = useProofSelection();
  const [formData, setFormData] = useState<JourneyFormData>({
    title: '',
    location: '',
    description: '',
    guestCapacity: '',
    budget: '',
    startDate: undefined,
    finishDate: undefined,
    requiredProofs: [],
    customProofs: [],
    status: JourneyStatusEnum.PENDING,
    optionalQuestion: '',
    photo: '',
    creatorAddress: publicAddress 
  })

  const router = useRouter();

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      requiredProofs: proofData.requiredProofs,
      customProofs: proofData.customProofs
    }));
  }, [proofData]);

  useEffect(() => {
    const savedData = localStorage.getItem('journeyEditData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      const startDate = parsedData.startDate ? new Date(parsedData.startDate) : undefined;
      const finishDate = parsedData.finishDate ? new Date(parsedData.finishDate) : undefined;

      setFormData(prev => ({
        ...prev,
        ...parsedData,
        startDate,
        finishDate
      }));

      if (parsedData.requiredProofs) {
        parsedData.requiredProofs.forEach((proof: ProofNameEnum) => {
          handleProofClick(proof);
        });
      }
      if (parsedData.customProofs) {
        parsedData.customProofs.forEach((proof: ProofNameEnum) => {
          handleProofClick(proof);
        });
      }

      localStorage.removeItem('journeyEditData');
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    
    // Handle numeric inputs
    if (id === 'budget' || id === 'guestCapacity') {
      // Only allow numbers and empty string
      if (value === '' || /^\d+$/.test(value)) {
        setFormData(prev => ({
          ...prev,
          [id]: value
        }))
      }
      return
    }

    // Handle other inputs normally
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  };

  const handleProofSelection = (proofEnum: ProofNameEnum) => {
    handleProofClick(proofEnum);
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

  const goToPreviewCreate = () => {
    // Required fields validation
    const requiredFields = {
      title: 'Journey Title',
      location: 'Location',
      description: 'Description',
      guestCapacity: 'Guest Capacity',
      budget: 'Budget',
      startDate: 'Start Date',
      finishDate: 'Finish Date',
      photo: 'Journey Photo'
    }

    const missingFields = Object.entries(requiredFields).reduce((acc: string[], [key, label]) => {
      if (!formData[key as keyof typeof formData]) acc.push(label)
      return acc
    }, [])

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields:\n${missingFields.join('\n')}`)
      return
    }

    if (formData.photo) {
      localStorage.setItem('journeyTempPhoto', formData.photo)
    }
    
    const serializedFormData = {
      ...formData,
      photo: undefined,
      startDate: formData.startDate?.toISOString(),
      finishDate: formData.finishDate?.toISOString(),
      creatorAddress: publicAddress,
      requiredProofs: formData.requiredProofs,
      customProofs: formData.customProofs
    }
    
    router.push(`/journey-preview?formData=${encodeURIComponent(JSON.stringify(serializedFormData))}`)
  }

  return (
    <div className="clay-page mx-auto min-h-screen max-w-md p-6">
      <h1 className="clay-surface clay-tone-peach mb-7 px-6 py-6 text-center text-3xl font-bold">Create a Journey</h1>

      <div className="clay-surface clay-tone-white space-y-5 px-5 py-6">
        <div>
          <Label htmlFor="title">Journey Title</Label>
          <Input 
          variant="clay"
          id="title" 
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Journey Title" />
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
            className="pl-10" />
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
                  onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                  disabled={{ before: new Date() }}
                  initialFocus />
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
                  disabled={{ before: formData.startDate || new Date() }}
                  initialFocus />
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
              type="text"
              inputMode="numeric"
              pattern="\d*" />
          </div>
          <div>
            <Label htmlFor="guestCapacity">Share with max. of...</Label>
            <Input 
              variant="clay"
              id="guestCapacity"
              value={formData.guestCapacity}
              onChange={handleInputChange}
              placeholder="# Nomads"
              type="text"
              inputMode="numeric"
              pattern="\d*" />
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
          className="h-28" />
        </div>

        <div className="space-y-2">
          <Label>Journey Photo</Label>
          <div className="flex flex-col items-center gap-4">
            {formData.photo && (
              <div className="clay-image-frame relative aspect-video w-full bg-clay-sky">
                <button
                  onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
                  className="clay-control absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-red-600 p-2 hover:bg-red-700"
                  type="button"
                  aria-label="Remove image"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
                <Image
                  src={formData.photo}
                  alt="Journey preview"
                  fill
                  className="object-contain"
                />
              </div>
            )}
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
              {formData.photo ? 'Change photo' : 'Load photo'}
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="optionalQuestion">Optional questions</Label>
          <Input 
          variant="clay"
          id="optionalQuestion" 
          value={formData.optionalQuestion}
          onChange={handleInputChange}
          placeholder="Example: What makes you the perfect candidate?" />
        </div>

        <ProofSelector
          filters={filters}
          onProofClick={handleProofSelection}
          isProofRequired={isProofRequired}
          isProofCustom={isProofCustom}
        />

        <div className="flex items-center justify-center">
          <Button 
            variant="clayPrimary"
            size="clay"
            className="my-4 mx-auto w-full max-w-[260px] text-lg"
            onClick={goToPreviewCreate}
          >
            Preview & Create
          </Button>
        </div>
      </div>
    </div>
  )
}
