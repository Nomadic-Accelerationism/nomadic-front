"use client";
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, MapPinIcon } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation';
import { JourneyFormData,JourneyStatusEnum } from '@/interfaces/Journey';
import { ProofNameEnum } from '@/interfaces/ProofItem';

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
  const [formData, setFormData] = useState<JourneyFormData>({
    title: '',
    location: '',
    description: '',
    guestCapacity: '',
    budget: '',
    startDate: undefined,
    finishDate: undefined,
    requiredProofs: [],
    status: JourneyStatusEnum.ANOUNCED,
    optionalQuestion: '',
    photo: ''
  })
  
  const router = useRouter();
  
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
  
  const toggleFilter = (filterId: string) => {
    const filter = filters.find(f => f.id === filterId);
    if (!filter) return;
    
    setFormData(prev => ({
      ...prev,
      requiredProofs: prev.requiredProofs.includes(filter.proofEnum)
        ? prev.requiredProofs.filter(proof => proof !== filter.proofEnum)
        : [...prev.requiredProofs, filter.proofEnum]
    }));
  };
    

  const goToPreviewCreate = () => {
    console.log("Form Data:",formData);
    if (formData.photo) {
      localStorage.setItem('journeyTempPhoto', formData.photo);
    }
    const serializedFormData = {
      ...formData, 
      photo: undefined,
      startDate: formData.startDate?.toISOString(),
      finishDate: formData.finishDate?.toISOString()
    }
    router.push(`/journey-preview?formData=${encodeURIComponent(JSON.stringify(serializedFormData))}`);
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Create a Journey</h1>
      
      <div className="space-y-4 items-center justify-center">
        <div>
          <Label htmlFor="title">Journey Title</Label>
          <Input 
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
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.startDate ? format(formData.startDate, "PPP") 
                    : <span>Select a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar 
                mode="single" 
                selected={formData.startDate}
                onSelect={(date) => setFormData(prev => ({ ...prev,
                  startDate: date}))}
                initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>To</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.finishDate ? format(formData.finishDate, "PPP") 
                    : <span>Select a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar 
                mode="single" 
                selected={formData.finishDate}
                onSelect={(date) => setFormData(prev => ({...prev,
                finishDate: date}))}
                initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="budget">Max Budget per Nomad</Label>
            <Input
            id="budget"
            value = {formData.budget}
            onChange={handleInputChange}
            placeholder="USDC" />
          </div>
          <div>
            <Label htmlFor="guestCapacity">Share with max. of...</Label>
            <Input 
            id="guestCapacity"
            value = {formData.guestCapacity}
              onChange={handleInputChange}
            placeholder="# Nomads" />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea 
          id="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Description" 
          className="h-24" />
        </div>

        <div>
          <input
            type="file"
            id="photo-upload"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
          <Button 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => document.getElementById('photo-upload')?.click()}
          >
            Load photo
          </Button>
        </div>

        <div>
          <Label htmlFor="optionalQuestion">Optional questions</Label>
          <Input 
          id="optionalQuestion" 
          value={formData.optionalQuestion}
          onChange={handleInputChange}
          placeholder="Example: What makes you the perfect candidate?" />
        </div>

        <div>
          <Label>Filters</Label>
          <div className="grid grid-cols-8 gap-2 mt-2">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                variant="outline"
                className={`p-1 aspect-square ${formData.requiredProofs.includes(filter.proofEnum) ? 'ring-2 ring-orange-500' : ''}`}
                onClick={() => toggleFilter(filter.id)}
              >
                <div className={`w-full h-full rounded-md ${filter.color} flex items-center justify-center`}>
                  <img src={filter.icon} alt={filter.id} className="w-14 h-8" />
                </div>
              </Button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Tap once to activate a Requested Proof. Tap twice to make it mandatory 🔒
          </p>

        </div>


        <div  className="flex items-center justify-center">
        <Button 
          className="w-full max-w-[230px] my-4 bg-[#ff671e] hover:bg-orange-500 text-black text-xl py-8 rounded-xl shadow-xl border border-gray-600 mx-auto"
            onClick={goToPreviewCreate}
          >
          Preview & Create
          </Button>

        </div>


      </div>
    </div>
  )
}
