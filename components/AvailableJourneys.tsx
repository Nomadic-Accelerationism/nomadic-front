"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Journey, JourneyStatusEnum } from '@/interfaces/Journey';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function AvailableJourneys() {
  const [availableJourneys, setAvailableJourneys] = useState<Journey[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { didToken, publicAddress, isAuthenticated } = useUser();

  const fetchAvailableJourneys = useCallback(async () => {
    try {
      const response = await axios.post('/api/auth/get-all-journeys', {
        didToken,
        publicAddress,
      });

      if (response.data) {
        const journeys = response.data.journeys || [];
        const filtered = journeys.filter(
          (journey: Journey) =>
            journey.creatorAddress !== publicAddress &&
            journey.status === JourneyStatusEnum.CONFIRMED
        );
        setAvailableJourneys(filtered);
      }
    } catch (error) {
      console.error('Error fetching available journeys:', error);
    } finally {
      setIsLoading(false);
    }
  }, [didToken, publicAddress]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAvailableJourneys();
    }
  }, [isAuthenticated, fetchAvailableJourneys]);

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

  if (isLoading) return null;
  if (availableJourneys.length === 0) return null;

  return (
    <div className="w-full mb-8">
      <h2 className="text-2xl font-semibold mb-6 text-center">Discover What&apos;s Up</h2>
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
                <Link href={`/journey/${journey.id}`}>
                  <div className="rounded-2xl overflow-hidden shadow-2xl">
                    <div className="relative h-[200px]">
                      <Image
                        src={journey.photo || '/placeholder.jpg'}
                        alt={journey.title}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-2xl"
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
                          {new Date(journey.startDate).toLocaleDateString()} - 
                          {new Date(journey.finishDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={prevJourney}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors duration-200"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>
        <button
          onClick={nextJourney}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors duration-200"
        >
          <ChevronRight className="h-6 w-6 text-white" />
        </button>
      </div>
    </div>
  );
}