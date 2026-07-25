"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogOverlay, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmationCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCodeSubmit?: (code: string) => void;
}

export function ConfirmationCodeModal({ isOpen, onClose, onCodeSubmit }: ConfirmationCodeModalProps) {
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

  const handleSubmit = () => {
    const completeCode = code.join('');
    if (completeCode.length === 6 && onCodeSubmit) {
      onCodeSubmit(completeCode);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogOverlay className="bg-black/50 fixed inset-0" />
      <DialogContent className="clay-surface clay-tone-white fixed left-1/2 top-1/2 w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[32px] border-none p-8">
        <DialogTitle className="text-2xl font-medium text-[#000000] text-center">
          Confirmation Code
        </DialogTitle>
        <DialogDescription className="mt-2 text-clay-muted">
          Please enter the verification code sent to your email.
        </DialogDescription>

        <div className="space-y-6">
          <p className="clay-surface clay-tone-peach rounded-[20px] px-4 py-3 font-semibold text-clay-ink">
            You&apos;re about to cancel this HH request, this action cannot be reverted.
          </p>

          <p className="text-clay-muted">You can check on your e-mail</p>

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
                className="clay-field h-12 w-12 rounded-[16px] px-0 text-center text-lg font-bold"
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>

          <button
            className="rounded-lg px-2 py-2 text-sm font-semibold text-clay-muted underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-3 focus-visible:outline-clay-ink"
            onClick={() => console.log("Send new code")}
          >
            Send new code
          </button>

          <div className="flex justify-center gap-4">
            <Button
              variant="claySecondary"
              size="clay"
              className="w-1/2"
              onClick={() => onClose()}
            >
              Go Back
            </Button>
            <Button
              variant="clayPrimary"
              size="clay"
              className="w-1/2"
              onClick={handleSubmit}
              disabled={code.join('').length !== 6}
            >
              Verify
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
