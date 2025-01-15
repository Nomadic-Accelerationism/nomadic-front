'use client'

import { useState } from 'react'
import { Share, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface GeneratedIdProps {
  id: string;
  onShare?: () => void;
}

export default function GeneratedId({ id, onShare }: GeneratedIdProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleShare = () => {
    if (onShare) {
      onShare()
    }
  }

  return (
    <div className="max-w-[600px] mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center">
        Single Use ID Generated
      </h1>

      <Card className="bg-orange-50 border-orange-200 relative group">
        <div className="p-4 pr-12 text-lg">
          <span className="font-medium">Single Use ID: </span>
          {id}
          <button
            onClick={handleCopy}
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded transition-colors",
              "hover:bg-orange-100 focus:bg-orange-100 focus:outline-none",
              copied ? "text-green-600" : "text-gray-500"
            )}
            aria-label={copied ? "Copied!" : "Copy to clipboard"}
          >
            {copied ? (
              <Check className="h-5 w-5" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </button>
        </div>
      </Card>

      <div className="flex justify-center">
        <Button
          onClick={handleShare}
          className="w-full max-w-[200px] bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-6 text-xl"
        >
          <Share className="mr-2 h-5 w-5" />
          Share
        </Button>
      </div>
    </div>
  )
}

