"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog"

interface SuccessfulModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SuccessfulModal({ open, onOpenChange }: SuccessfulModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/50 fixed inset-0" />
      <DialogContent className="bg-[#ffffff] rounded-[32px] w-full max-w-xs p-8 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-none">
        <button
          className="absolute right-6 top-6 text-[#000000] hover:text-[#808080] transition-colors"
          onClick={() => onOpenChange(false)}
        >
        </button>

        <div className="space-y-6 flex flex-col items-center">
          <h2 className="text-2xl font-medium text-[#000000] text-center">Successful!</h2>

          <img
            src="/images/success.png"
            alt="Buff Doge meme"
            className="w-40 h-40 object-contain"
          />

          <button
            className="px-8 py-3 bg-[#ff671f] text-[#000000] rounded-xl font-medium hover:bg-[#111111] hover:text-white transition-colors"
            onClick={() => onOpenChange(false)}
          >
            LFG!
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}