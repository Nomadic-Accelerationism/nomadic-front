"use client"

import React, { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image'
import { Journey } from '@/interfaces/Journey';
import { Magic } from 'magic-sdk'
import { Input } from "@/components/ui/input"
import axios from 'axios'
import { useUser } from '@/contexts/UserContext';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react";

const createMagic = () => {
  return typeof window !== 'undefined' 
    ? new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY || '')
    : null;
};

const magic = createMagic();

if (magic) {
  magic.preload();
}

export default function JourneySuccessComponent() {
  const [journey, setJourney] = useState<Journey | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userMetadata } = useUser()
  
  useEffect(() => {
    const status = searchParams.get('status')
    
    if (status === 'pending') {
      setJourney({
        id: searchParams.get('id') || '',
        title: searchParams.get('title') || '',
        photo: searchParams.get('photo') || '',
        status: 'PENDING'
      } as Journey)
    } else {
      const journeyData = localStorage.getItem('createdJourney')
      const photo = localStorage.getItem('journeyTempPhoto')
    
      if (journeyData) {
        const parsedJourney = JSON.parse(journeyData)
        setJourney({
          ...parsedJourney,
          photo: photo || parsedJourney.photo
        })
      }
    }
  }, [searchParams])

  if (!journey) {
    return <div>Loading...</div>
  }
  
  
  const handleCancelVerification = async () => {
    try {
      setIsLoading(true)

      if (!magic) {
        throw new Error('Magic SDK is not initialized')
      }


      if (!userMetadata?.email) {
        throw new Error('No email available')
      }


      const newDidToken = await magic.auth.loginWithEmailOTP({ 
        email: userMetadata.email,
        showUI: true
      }).catch(error => {
        console.error('Magic OTP error:', error)
        throw error
      })


      const validationResponse = await axios.post('/api/auth/validate-otp', {
        email: userMetadata.email,
        didToken: newDidToken
      })
  
      if (validationResponse.data) {
        console.log('OTP verification successful, proceeding to delete journey')


        const deleteResponse = await axios.post('/api/auth/delete-journey', {
          journeyId: journey.id,
          didToken: newDidToken
        })
  
        if (deleteResponse.data) {
          console.log('Journey deleted successfully')
          setIsCancelDialogOpen(false)
          router.push('/hacker-journeys')
        }
      }

    } catch (error) {
      console.error('Complete error details:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Verification failed')
      setIsErrorDialogOpen(true)
    } finally {
      setIsLoading(false)
    }
  }



  const isPending = searchParams.get('status') === 'pending'
  return (
    <div className="w-full max-w-md mx-auto bg-white p-6 rounded-lg">
      <h1 className="text-2xl font-bold text-center mb-4">
        {isPending 
          ? `Application to ${journey.title} sent,thank you!`
          : `Your Journey #${journey.id} ${journey.title} was created`
        }
      </h1>

      <div className="relative h-48 w-full mb-4 rounded-lg overflow-hidden">
        <Image
          src={journey.photo || '/placeholder.svg'}
          alt={journey.title}
          fill
          className="object-cover"
          priority
        />
      </div>

      <p className="text-gray-600 text-center mb-6">
        {isPending 
          ? "Watch closely for the status of your application in My Journeys, you'll have news soon"
          : "Please wait a few hours, your Journey is being reviewed for your security and the security of the ones using the platform."
        }

        {!isPending && (
          <p className="mt-4">
            If you have any questions please send a XMTP message to nacc.eth
          </p>
        )}
      </p>

      <div className="flex items-center justify-center mb-6">
        <Button 
          className="w-full max-w-[230px] bg-[#ff671e] hover:bg-orange-500 text-black text-xl py-8 rounded-xl shadow-xl border border-gray-600"
          onClick={() => router.push('/hacker-journeys')}
        >
          {isPending ? 'LFG' : 'LFG'}
        </Button>
      </div>

      <div className="text-center">
        <button
          onClick={isPending ? () => setIsCancelDialogOpen(true) : () => router.push('/journey-cancel')}
          className="text-gray-500 underline hover:text-gray-700"
        >
          Cancel journey
        </button>
      </div>

      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Journey</AlertDialogTitle>
            <AlertDialogDescription>
              We will send a verification code to {userMetadata?.email} to confirm the cancellation.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <Button 
              onClick={handleCancelVerification}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Send Verification Code'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => setIsErrorDialogOpen(false)}>OK</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}