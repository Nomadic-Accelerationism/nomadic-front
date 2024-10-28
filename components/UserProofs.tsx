/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search } from 'lucide-react'

import { ProofItem } from "@/interfaces/ProofItem"

const proofItems: ProofItem[] = [
  { name: "$APE Holder", icon: "/proofs/ape-holder.png", isActive: true },
  { name: "Bored Ape Yatch Club NFT Holder", icon: "/proofs/bayc-nft.png", isActive: false },
  { name: "ETHGlobal Attendee", icon: "/proofs/ethglobal-attendee.png", isActive: false },
  { name: "I've met Patricio POAP", icon: "/proofs/poap-icon.png", isActive: true },
  { name: "$NOUNS Holder", icon: "/proofs/nouns-icon.png", isActive: true },
  { name: "Talent Protocol Passport", icon: "/proofs/talent-icon.png", isActive: true },
  { name: "World ID Human Verification", icon: "/proofs/world-id-icon.png", isActive: true },
];

export default function UserProofsComponent() {
  return (
    <div className="max-w-sm mx-auto py-4 space-y-4 px-8">
      <h1 className="text-2xl font-bold text-center">My Proofs</h1>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input type="text" placeholder="Search" className="pl-10 rounded-xl bg-gray-100" />
      </div>
      
      {proofItems.map((item, index) => (
        <Card 
          key={index} 
          className={`flex items-center justify-between  rounded-xl border border-gray-700 ${
            item.isActive ? 'bg-white' : 'bg-gray-200'
          }`}
        >
          <span className="text-sm font-medium p-3 ml-3">{item.name}</span>
          <img src={item.icon} alt={item.name} className="w-12 h-12" />
        </Card>
      ))}
    </div>
  );
}