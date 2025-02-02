"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Journey, JourneyStatusEnum } from '@/interfaces/Journey';
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';

export function AvailableJourneys() {
  const [availableJourneys, setAvailableJourneys] = useState<Journey[]>([]);
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

  if (isLoading) return null;
  if (availableJourneys.length === 0) return null;

  return (
    <div className="w-full mb-8">
      <h2 className="text-xl font-semibold mb-4">Available Journeys</h2>
      <div className="space-y-4">
        {availableJourneys.map((journey) => (
          <Link 
            key={journey.id}
            href={`/journey/${journey.id}`}
            className="block"
          >
            <div className="rounded-lg overflow-hidden shadow-lg">
              <div className="relative h-28">
                <Image
                  src={journey.photo || '/placeholder.jpg'}
                  alt={journey.title}
                  layout="fill"
                  objectFit="cover"
                  className="z-0"
                />
                <div className="relative z-10 p-4">
                  <h3 className="text-white text-lg font-semibold">{journey.title}</h3>
                  <div className="flex justify-between items-center">
                    <span className="bg-green-500 px-2 py-1 rounded-full text-xs font-semibold">
                      Confirmed
                    </span>
                    <span className="bg-white text-black px-2 py-1 rounded-full text-xs font-semibold">
                      {journey.budget}$
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}