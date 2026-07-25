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
import { ClayState } from "@/components/ui/clay-state";

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

    console.log('Form Data:', formData);
    router.push('/journey-success?status=applied');
  };

  if (!journey) {
    return <ClayState kind="loading" title="Loading journey" />;
  }

  return (
    <div className="clay-page mx-auto min-h-screen max-w-md p-6">
      <h1 className="clay-surface clay-tone-mint mb-7 px-6 py-6 text-center text-3xl font-bold">Apply to Journey</h1>

      <div className="clay-surface clay-tone-butter mb-6 px-5 py-5">
        <h2 className="text-xl font-semibold mb-2">{journey.title}</h2>
        <p className="text-sm mb-2">{journey.location}</p>
        <p className="text-sm font-semibold text-clay-ink">
          {journey.startDate && format(new Date(journey.startDate), "PPP")} - {" "}
          {journey.endDate && format(new Date(journey.endDate), "PPP")}
        </p>
        <p className="text-sm font-semibold text-clay-ink">Budget: {journey.budget} USDC</p>
      </div>

      <div className="clay-surface clay-tone-white px-5 py-6">
      {journey.optionalQuestion && (
        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="response">Question from Host</Label>
            <p className="text-sm mb-2">{journey.optionalQuestion}</p>
            <Textarea
              variant="clay"
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
            variant="clay"
            id="socialMediaHandle"
            value={formData.socialMediaHandle}
            onChange={handleInputChange}
            placeholder="@username"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          variant="clayPrimary"
          size="clay"
          onClick={handleSubmit}
          className="w-full max-w-[260px] text-lg"
        >
          Submit Application
        </Button>
      </div>
      </div>
    </div>
  );
}
