/* eslint-disable react-hooks/exhaustive-deps */
"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Search } from 'lucide-react'

import { getMetMessage, getNotMetMessage, ProofItem } from "@/interfaces/ProofItem"
import { useUser } from '@/contexts/UserContext';
import { notMetMessages, metMessages } from '@/interfaces/ProofItem';
import axios from 'axios';

import { useLogin,usePrivy } from '@privy-io/react-auth'

export default function UserProofsComponent() {

  const userContext = useUser();
  const { publicAddress, setPublicAddress, setDidToken } = userContext;
  const didToken = userContext.didToken;
  const [proofItems, setProofItems] = useState<ProofItem[]>([]);
  const [open, setOpen] = useState(false);
  const [openResult, setOpenResult] = useState(false);
  const [proofItem, setProofItem] = useState<ProofItem>();
  const [proofItemResult, setProofItemResult] = useState<ProofItem>();
  
  
  const { authenticated, ready, user,logout } = usePrivy()

  const {login} = useLogin({
    onComplete: () => {
      console.log("login complete")
      const storedToken = !didToken ? localStorage.getItem('didToken') || '' : didToken;
      if (user?.wallet?.address) processProof(user.wallet.address, storedToken)
      logout()
      console.log("logged out")
    }
  });

  const fetchProofs = async (storedAddress: string, storedToken: string) => {
    try {
      const data = await getUserProofs(storedAddress, storedToken);
      setProofItems(data);
    } catch (error) {
      console.error("Error fetching proofs:", error);
    }
  };  

  useEffect(() => {

    const storedAddress = !publicAddress ? localStorage.getItem('publicAddress') || '' : publicAddress;
    const storedToken = !didToken ? localStorage.getItem('didToken') || '' : didToken;


    if (!publicAddress || !didToken) {
      setPublicAddress(storedAddress);
      setDidToken(storedToken);
    }

    const fetchProofs2 = async () => {
      try {
        const data = await getUserProofs(storedAddress, storedToken);
        setProofItems(data);
      } catch (error) {
        console.error("Error fetching proofs:", error);
      }
    };  
  
    if (publicAddress && didToken) {
      console.log("fetching proofs");
      fetchProofs2();
    }
  }, [publicAddress, didToken]);


  const verifyProof = async (proof: ProofItem) => {
    console.log("verifyProof: ", proof);
    setProofItem(proof);
    setOpen(true);
  }

  const getUserProofs = async (publicAddress: string, didToken: string) => {
    const response = await axios.post('/api/auth/get-proof-hacker-list', {
      publicAddress,
      didToken
    });
    console.log("response: ", response);
    return response.data;
  }

  // **********

  const processProof = async (walletAddress: string, didToken: string) => {
    console.log("walletAddress: ", walletAddress)
    console.log("processProof: ", proofItem)
    console.log("didToken: ", didToken)

    if (!proofItem?.proof) return

    switch (proofItem.proof.toString().toUpperCase()) {
      case "PATRICIO_POAP":
        const responsePoaps = await axios.post('/api/auth/get-poaps', {
          wallet: walletAddress,
          didToken
        })
        console.log("responsePoaps: ", responsePoaps)
        setProofItemResult(responsePoaps.data.proof)
        break
      case "TALENT_PROTOCOL_PASSPORT":
        const responseTalent = await axios.post('/api/auth/get-talent', {
          wallet: walletAddress,
          didToken
        })
        console.log("responseTalent: ", responseTalent)
        setProofItemResult(responseTalent.data.proof)
        break
      default:
        console.warn(`Unhandled proof type: ${proofItem.proof}`)
    }

    // show the second dialog
    setOpenResult(true)

    const storedAddress = !publicAddress ? localStorage.getItem('publicAddress') || '' : publicAddress
    const storedToken = !didToken ? localStorage.getItem('didToken') || '' : didToken
    fetchProofs(storedAddress, storedToken)
  }


  return (
    <>
    <div className="max-w-sm mx-auto py-4 space-y-4 px-8">
      <h1 className="text-2xl font-bold text-center">My Proofs</h1>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input type="text" placeholder="Search" className="pl-10 rounded-xl bg-gray-100" />
      </div>
      
      {proofItems.map((item, index) => (
        <Card 
          key={index} 
          className={`flex items-center justify-between rounded-xl border border-gray-700 py-1 ${
            item.isActive ? 'bg-white' : 'bg-gray-200'
          }`}
          onClick={() => verifyProof(item)}
        >
          <span className="text-sm font-medium p-3 ml-3">{item.name}</span>
          <div className="relative">
            <img src={item.icon} alt={item.name} className="w-12 h-12 mr-1" />
            {!item.isActive && (
              <div className="absolute inset-0 bg-gray-500 opacity-50 mr-1 rounded-lg"></div>
            )}
          </div>
        </Card>
      ))}
    </div>

    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[385px] rounded-3xl">
          <DialogHeader className="text-center space-y-4">
            <DialogTitle className="text-2xl font-normal">
              {proofItem?.title}
          </DialogTitle>
          <p className="text-lg text-center text-muted-foreground">
            {proofItem?.description}
          </p>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="relative">
            <div className="w-32 h-32 flex items-center justify-center">
              <img
                src={`${proofItem?.icon}?height=100&width=100`}
                alt="POAP Badge"
                className="w-24 h-24"
              />
            </div>
          </div>
          <div className="px-6 py-2 rounded-full bg-muted">
            { proofItem?.isActive ? "Generated" : "Not Generated"}
          </div>
          {proofItem && (
            <>
              <p className="text-lg text-center">
                { proofItem.isActive ? getMetMessage(proofItem.proof.toString()) : getNotMetMessage(proofItem.proof.toString())}
              </p>
              <Button className="w-full h-12 text-lg bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white rounded-full"
                onClick={() => login()}>
                { proofItem?.isActive ? "Update" : "Generate"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>

      <Dialog open={openResult} onOpenChange={setOpenResult}>
      <DialogContent className="max-w-[385px] rounded-3xl">
          <DialogHeader className="text-center space-y-4">
            <DialogTitle className="text-2xl font-normal">
              {proofItem?.title}
          </DialogTitle>
          <p className="text-lg text-center text-muted-foreground">
            {proofItem?.description}
          </p>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="relative">
            <div className="w-32 h-32 flex items-center justify-center">
              <img
                src={`${proofItem?.icon}?height=100&width=100`}
                alt="POAP Badge"
                className="w-24 h-24"
              />
            </div>
          </div>
          <div className={`px-6 py-2 rounded-full ${
            proofItemResult?.status ? 'bg-green-500' : 'bg-[#FF5C00]'
          }`}>
            {proofItemResult?.status ? "Generated" : "Not Found"}
          </div>
          {proofItem && (
            <>
              {/* <p className="text-lg text-center">
                { proofItem.isActive ? getMetMessage(proofItem.proof.toString()) : getNotMetMessage(proofItem.proof.toString())}
              </p> */}
              <Button className="w-full h-12 text-lg bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white rounded-full"
                onClick={() => setOpenResult(false)}>
                { proofItemResult?.status ? "LFG!" : "Try Again"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>    


    </Dialog>    
    </>
  );
}
