"use client"

import React, { useState } from 'react'
import { Journey } from '@/interfaces/Journey'
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import { Magic } from 'magic-sdk'
import axios from 'axios'
import { useUser } from '@/contexts/UserContext'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogCancel } from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"
import { JourneyDisplay } from './JourneyDisplay'

const magic = typeof window !== 'undefined' 
  ? new Magic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY || '')
  : null

interface CancelJourneyProps {
  journey: Journey
  isPending: boolean
}

export function CancelJourney({ journey, isPending }: CancelJourneyProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()
  const { userMetadata } = useUser()

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
        const updateResponse = await axios.post('/api/auth/update-journey', {
          journeyId: journey.id,
          status: 'CANCELLED',
          didToken: newDidToken
        })
        
        if (updateResponse.data) {
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

  return (
    <>
      <JourneyDisplay 
        journey={journey}
        isPending={isPending}
        onCancel={() => isPending ? setIsCancelDialogOpen(true) : router.push('/journey-cancel')}
      />

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
            <Button onClick={handleCancelVerification} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Verification Code'}
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
    </>
  )
}