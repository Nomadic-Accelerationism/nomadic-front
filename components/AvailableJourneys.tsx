"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Journey, JourneyStatusEnum } from '@/interfaces/Journey';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { JourneyDetailModal } from './modals/journey-detail-modal';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { Button } from "@/components/ui/button";

// Move the fetch function outside the component
async function fetchJourneys({ publicAddress, didToken }: { publicAddress: string; didToken: string }) {
  if (!publicAddress || !didToken) return []
  
  const response = await api.post('/api/auth/get-all-journeys', {
    publicAddress,
    didToken
  })

  const journeys = response.data?.journeys || []
  return journeys.filter(
    (journey: Journey) =>
      journey.creatorAddress !== publicAddress &&
      journey.status === JourneyStatusEnum.CONFIRMED
  )
}

export function AvailableJourneys() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const { didToken, publicAddress, isAuthenticated } = useUser();
  const router = useRouter();

  const { data: availableJourneys = [], isLoading } = useQuery<Journey[]>({
    queryKey: ['available-journeys', didToken, publicAddress],
    queryFn: () => fetchJourneys({ publicAddress, didToken }),
    enabled: isAuthenticated && Boolean(didToken) && Boolean(publicAddress),
  });

  const nextJourney = () => {
    setCurrentIndex((prev) => 
      prev === availableJourneys.length - 1 ? 0 : prev + 1
    );
  };

  const prevJourney = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? availableJourneys.length - 1 : prev - 1
    );
  };

  const handleJourneyClick = (journey: Journey) => {
    setSelectedJourney(journey);
    setIsDetailModalOpen(true);
  };

  const handleApply = () => {
    if (selectedJourney) {
      router.push(`/journey-success?status=pending&id=${selectedJourney.id}&title=${encodeURIComponent(selectedJourney.title)}&photo=${encodeURIComponent(selectedJourney.photo || '')}`);
      setIsDetailModalOpen(false);
    }
  };

  if (isLoading) return null;
  if (availableJourneys.length === 0) return null;

  return (
    <div className="clay-surface clay-tone-lilac mb-8 w-full px-4 py-6">
      <h2 className="mb-6 text-center text-2xl font-bold">Discover What&apos;s Up</h2>
      <div className="relative">
        <div className="relative h-[250px] w-full overflow-hidden">
          <div className="absolute w-full h-full flex items-center justify-center">
            {availableJourneys.map((journey, idx) => (
              <div
                key={journey.id}
                className={`absolute w-[320px] transition-all duration-500 ${
                  idx === currentIndex
                    ? 'z-20 scale-100 opacity-100'
                    : idx === (currentIndex + 1) % availableJourneys.length
                    ? 'z-10 scale-90 opacity-60 translate-x-[60%]'
                    : idx === (currentIndex - 1 + availableJourneys.length) % availableJourneys.length
                    ? 'z-10 scale-90 opacity-60 -translate-x-[60%]'
                    : 'z-0 scale-80 opacity-0'
                }`}
              >
                <button
                  type="button"
                  className="clay-image-frame clay-interactive w-full cursor-pointer bg-clay-peach text-left focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-clay-ink"
                  onClick={() => handleJourneyClick(journey)}
                  aria-label={`View ${journey.title}`}
                >
                  <div className="relative h-[200px] overflow-hidden rounded-[22px]">
                    <Image
                      src={journey.photo || '/placeholder.jpg'}
                      alt={journey.title}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-[22px]"
                    />
                    <div className="absolute top-0 left-0 right-0 bg-black/50 backdrop-blur-sm py-2 px-4">
                      <h3 className="text-white text-xl font-bold text-center">
                        {journey.title}
                      </h3>
                    </div>

                    <div className="absolute bottom-0 w-full py-2 px-4 bg-black/70 backdrop-blur-sm flex justify-between items-center">
                      <span className="text-white font-semibold">
                        ${journey.budget}
                      </span>
                      <span className="text-white text-sm">
                        {journey.startDate ? new Date(journey.startDate).toLocaleDateString() : '-'} -
                        {journey.endDate ? new Date(journey.endDate).toLocaleDateString() : '-'}
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>

        <Button
          type="button"
          variant="clayIcon"
          onClick={prevJourney}
          className="absolute left-0 top-1/2 z-30 -translate-y-1/2 bg-clay-sky"
          aria-label="Previous journey"
        >
          <ChevronLeft className="h-6 w-6 text-clay-ink" />
        </Button>
        <Button
          type="button"
          variant="clayIcon"
          onClick={nextJourney}
          className="absolute right-0 top-1/2 z-30 -translate-y-1/2 bg-clay-sky"
          aria-label="Next journey"
        >
          <ChevronRight className="h-6 w-6 text-clay-ink" />
        </Button>
      </div>

      {selectedJourney && (
        <JourneyDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          journey={selectedJourney}
          onApply={handleApply}
        />
      )}
    </div>
  );
}
