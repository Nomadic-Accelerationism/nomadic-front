"use client";

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter, useSearchParams } from 'next/navigation';
import { Journey } from '@/interfaces/Journey';
import { useUser } from '@/contexts/UserContext';
import Image from 'next/image';
import { format } from "date-fns";

export default function JourneyApplyComponent() {
  const { publicAddress } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [formData, setFormData] = useState({
    applicantAddress: publicAddress,
    journeyId: '',
    response: '',
    socialMediaHandle: '',
  });

  useEffect(() => {
    // Recuperar los datos del journey desde los parámetros URL
    const journeyData = searchParams.get('journeyData');
    if (journeyData) {
      setJourney(JSON.parse(decodeURIComponent(journeyData)));
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async () => {
    // Aquí implementarías la lógica para enviar la aplicación
    console.log('Form Data:', formData);
    // Redirigir a una página de confirmación
    router.push('/journey-success?status=applied');
  };

  if (!journey) return <div>Loading...</div>;

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Apply to Journey</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">{journey.title}</h2>
        <p className="text-sm mb-2">{journey.location}</p>
        <p className="text-orange-500 text-sm">
          {journey.startDate && format(new Date(journey.startDate), "PPP")} - {" "}
          {journey.endDate && format(new Date(journey.endDate), "PPP")}
        </p>
        <p className="text-orange-500 text-sm">Budget: {journey.budget} USDC</p>
      </div>

      {journey.optionalQuestion && (
        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="response">Question from Host</Label>
            <p className="text-sm mb-2">{journey.optionalQuestion}</p>
            <Textarea
              id="response"
              value={formData.response}
              onChange={handleInputChange}
              placeholder="Your answer"
              className="h-24"
            />
          </div>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <Label htmlFor="socialMediaHandle">Your Social Media Handle</Label>
          <Input
            id="socialMediaHandle"
            value={formData.socialMediaHandle}
            onChange={handleInputChange}
            placeholder="@username"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          className="w-full max-w-[230px] bg-[#ff671e] hover:bg-orange-500 text-black text-xl py-8 rounded-xl shadow-xl border border-gray-600"
        >
          Submit Application
        </Button>
      </div>
    </div>
  );
}