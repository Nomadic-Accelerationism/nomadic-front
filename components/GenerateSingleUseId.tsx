"use client";

import SearchGenerator from "./search-generator"
import type { Location } from '@/types/location'
import GeneratedId from "./generated-id"
import { useState } from "react";

export default function GenerateSingleUseIdComponent() {
    const [showGeneratedId, setShowGeneratedId] = useState(false)

    const handleGenerate = (location: Location) => {
        console.log('Generating ID for location:', location)
        setShowGeneratedId(true)
    }

    const handleShare = (id: string) => {
        console.log('Sharing ID:', id)
    }

    return (
        <>
            {!showGeneratedId && <SearchGenerator onGenerate={handleGenerate} />}

            {showGeneratedId && <GeneratedId id="1234567890" onShare={() => handleShare("1234567890")} />}
        </>
    )
}