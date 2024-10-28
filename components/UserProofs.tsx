/* eslint-disable react-hooks/exhaustive-deps */
"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search } from 'lucide-react'

import { ProofItem } from "@/interfaces/ProofItem"
import { useUser } from '@/contexts/UserContext';
import axios from 'axios';

export default function UserProofsComponent() {
  const userContext = useUser();
  const { publicAddress } = userContext;
  const didToken = userContext.didToken;
  const [proofItems, setProofItems] = useState<ProofItem[]>([]);

  useEffect(() => {
    const fetchProofs = async () => {
      try {
        const data = await getUserProofs(publicAddress, didToken);
        setProofItems(data);
      } catch (error) {
        console.error("Error fetching proofs:", error);
      }
    };

    if (publicAddress && didToken) {
      fetchProofs();
    }
  }, [publicAddress, didToken]);

  const getUserProofs = async (publicAddress: string, didToken: string) => {
    const response = await axios.post('/api/auth/get-proof-hacker-list', {
      publicAddress,
      didToken
    });
    console.log("response: ", response);
    return response.data;
  }

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
