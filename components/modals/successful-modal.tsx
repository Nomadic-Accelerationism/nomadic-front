"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from 'next/navigation'
import Image from "next/image"

interface SuccessfulModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SuccessfulModal({ open, onOpenChange }: SuccessfulModalProps) {
  const router = useRouter()

  const handleLFGClick = () => {
    onOpenChange(false)
    router.push('/hacker-journeys')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/50 fixed inset-0" />
      <DialogContent className="clay-surface clay-tone-mint fixed left-1/2 top-1/2 w-full max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-[32px] border-none p-8">
        <DialogTitle className="sr-only">Success</DialogTitle>
        <button
          className="clay-control absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-clay-white text-clay-ink"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-6 flex flex-col items-center">
          <h2 className="text-2xl font-medium text-[#000000] text-center">Successful!</h2>

          <Image
            src="/images/success.png"
            alt="Success"
            width={160}
            height={160}
            className="h-40 w-40 object-contain"
          />

          <button
            className="clay-control bg-clay-orange px-8 py-3 font-bold text-clay-ink"
            onClick={handleLFGClick}
          >
            LFG!
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
