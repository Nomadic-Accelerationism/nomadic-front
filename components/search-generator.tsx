'use client'

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Search } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { locations } from "@/data/locations"
import type { Location } from "@/types/location"

interface SearchGeneratorProps {
  onGenerate: (location: Location) => void;
}

export default function SearchGenerator({ onGenerate }: SearchGeneratorProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [isInteracting, setIsInteracting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSelect = (location: Location) => {
    setSelectedLocation(location)
    setInputValue(location.name)
    setOpen(false)
    setIsInteracting(false)
    if (inputRef.current) {
      inputRef.current.blur()
    }
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)
    setIsInteracting(true)
    if (selectedLocation && selectedLocation.name !== value) {
      setSelectedLocation(null)
    }
  }

  const handleInputFocus = () => {
    setIsInteracting(true)
    setOpen(true)
  }

  const handleInputBlur = () => {
    setTimeout(() => {
      setIsInteracting(false)
      setOpen(false)
    }, 200)
  }

  const handleGenerate = () => {
    if (selectedLocation) {
      onGenerate(selectedLocation)
    } else if (inputValue.trim()) {
      // Handle case where there's input but no selected location
      console.log('Generating with input:', inputValue)
      // You might want to create a new Location object or handle this case differently
      // For now, we'll just log it
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsInteracting(false)
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="max-w-[400px] mx-auto p-4 space-y-6 mt-8">
      <h1 className="text-2xl font-bold text-center">
        Generate Single Use ID
      </h1>

      <div className="relative">
        <Command className="rounded-xl border shadow-md relative border-gray-700">
          <div className="flex items-center border-b px-3">
            <CommandInput 
              ref={inputRef}
              value={selectedLocation ? selectedLocation.name : inputValue}
              onValueChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Search locations..." 
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          {open && (
            <CommandList className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-b-lg shadow-lg max-h-64 overflow-y-auto">
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {locations
                  .filter(location => 
                    location.name.toLowerCase().includes(inputValue.toLowerCase())
                  )
                  .map((location) => (
                    <CommandItem
                      key={location.id}
                      onSelect={() => handleSelect(location)}
                      className="cursor-pointer"
                    >
                      <span>{location.name}</span>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          )}
        </Command>
      </div>

      <div className="flex justify-center">
        <Button 
          onClick={handleGenerate}
          disabled={!selectedLocation && !inputValue.trim()}
          className="w-full max-w-[200px] bg-orange-500 hover:bg-orange-600 text-black rounded-xl py-6 text-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-md border-2 border-gray-600"
        >
          Generate
        </Button>
      </div>
    </div>
  )
}

