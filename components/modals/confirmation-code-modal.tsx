"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog"

interface ConfirmationCodeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConfirmationCodeModal({ open, onOpenChange }: ConfirmationCodeModalProps) {
  const [code, setCode] = React.useState<string[]>(Array(6).fill(""))
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

  const setInputRef = React.useCallback((index: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[index] = el;
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...code]
      newCode[index] = value
      setCode(newCode)

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, 6).split("")
    const newCode = [...code]
    pastedData.forEach((char, index) => {
      if (index < 6) newCode[index] = char
    })
    setCode(newCode)
    const lastIndex = Math.min(pastedData.length - 1, 5)
    inputRefs.current[lastIndex]?.focus()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/50 fixed inset-0" />
      <DialogContent className="bg-[#ffffff] rounded-[32px] w-7/8 max-w-md p-8 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-none">
        <button
          className="absolute right-8 top-8 text-[#000000] hover:text-[#808080] transition-colors"
          onClick={() => onOpenChange(false)}
        >
        </button>

        <div className="space-y-6">
          <h2 className="text-2xl font-medium text-[#000000] text-center">Confirmation code</h2>

          <p className="text-[#ff671f] font-medium">
            You&apos;re about to cancel this HH request, this action cannot be reverted.
          </p>

          <p className="text-[#808080]">You can check on your e-mail</p>

          <div className="flex gap-2 justify-between">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={setInputRef(index)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-12 rounded-lg bg-[#d9d9d9] text-center text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#808080] border border-black"
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>

          <button
            className="text-[#808080] hover:text-[#000000] transition-colors text-sm"
            onClick={() => console.log("Send new code")}
          >
            Send new code
          </button>

          <div className="flex justify-center">
            <button
              className="w-1/2 py-3 bg-gray-500 text-black rounded-xl transition-colors font-bold shadow-xl border-2 border-gray-600 "
              onClick={() => onOpenChange(false)}
            >
              Go Back
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
