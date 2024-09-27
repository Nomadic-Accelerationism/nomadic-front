"use client"

import Image from "next/image";
import MenuHouseHeaderComponent from "@/components/MenuHouseHeader";
import HackerHouseDetailComponent from "@/components/HackerHouseDetail";
import HackerHouseParticipantsComponent from "@/components/HackerHouseParticipants";
import { Button } from "@/components/ui/button"
interface HackerHouseDetailProps {
  number: string
  location: string
  name: string
  description: string
  price: string
  startDate: string
  endDate: string
  imageUrl: string
}

export default function HouseDetail() {

  const editHackerHouse = () => {
    console.log("editHackerHouse");
    //router.push('/user-proofs'); 
  }; 

  const hackerHouseDetail: HackerHouseDetailProps = {
    number: '16',
    location: 'Bangkok',
    name: 'STARKNET',
    description: "Join STARKNET's Hacker House in Bangkok! Collaborate with top tech talents in a vibrant, creative environment. Don't miss this unique opportunity!",
    price: '3000 USDC',
    startDate: '10/11/24',
    endDate: '20/11/24',
    imageUrl: '/images/house-bangkok.png?height=250&width=400'
  }

  return (
    <>
      <MenuHouseHeaderComponent />
      <HackerHouseDetailComponent {...hackerHouseDetail} />
      <HackerHouseParticipantsComponent />

      <div className="relative z-10 flex flex-col items-center mt-4 flex-grow w-full max-w-md px-6">
        <Button 
          className="w-full max-w-[230px] my-4 bg-[#ff671e] hover:bg-orange-500 text-black text-xl py-8 rounded-xl shadow-xl border border-gray-600"
          onClick={editHackerHouse}>
          Edit Hacker House
        </Button>      
      </div>

    </>
  );
}
