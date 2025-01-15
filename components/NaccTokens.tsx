"use client";

import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InfoIcon as InfoCircle } from 'lucide-react'
import { LineChart } from '@/components/ui/line-chart'

export default function NaccTokensComponent() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-between" style={{ minHeight: 'calc(100vh - 80px)' }}>
      {/* Background gradient */}
      <div
        className="absolute inset-0 z-0"
        style={{
          zIndex: 0,
          backgroundSize: '100% 100%',
          backgroundPosition: 'bottom',
          backgroundImage: 'linear-gradient(to top, #fe7432 5%, #ffcfb8 40%, white 60%, white 100%)'
      }}
      ></div>

    <div className="relative z-10 flex flex-col items-center mt-8 flex-grow w-full max-w-md px-6">

        <div className="space-y-2 mb-4">
            <h1 className="text-3xl font-bold">$NACC Tokens</h1>
            <p className="text-muted-foreground">
            Descripción del token
            </p>
        </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Image
            src="/images/nomadic-token.png"
            alt="Nomadic Logo"
            width={60}
            height={60}
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">0.002345USDC</div>
                <div className="text-xl">NACC</div>
              </div>
              <div className="text-right">
                <div className="text-emerald-500 text-xl">↑ 6.67%</div>
                <div className="text-muted-foreground">Today</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-orange-500">Balance</div>
            <div className="text-md font-bold">14,560,111.00 NACC</div>
          </div>
          <div className="text-right">
            <div className="text-orange-500">Value</div>
            <div className="text-md font-bold">68 USDC</div>
          </div>
        </div>
      </Card>

      <Card className="p-4 z-10 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="bg-orange-500 text-white px-2 py-1 rounded">1W</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">1D</Button>
            <Button variant="outline" size="sm">1M</Button>
            <Button variant="outline" size="sm">1Y</Button>
          </div>
        </div>
        <div className="h-48 w-full">
          <LineChart 
            data={[10, 20, 30, 25, 45, 35, 55, 40, 60, 50, 70]}
            strokeColor="#f97316"
            fillColor="#fff7ed"
          />
        </div>
      </Card>

      <div className="flex items-center gap-2 text-sm z-10 mt-4">
        <span>This NACC is on the FHE Network</span>
        <InfoCircle className="h-4 w-4" />
      </div>

      <div className="grid grid-cols-2 gap-8 z-10 mt-6">
        <Button className="w-full h-11 bg-[#9cfe1f] hover:bg-[#9cfe1f] text-black text-lg shadow-lg">Buy</Button>
        <Button className="w-full h-11 bg-[#ff671e] hover:bg-[#ff671e] text-black text-lg shadow-lg">Stake</Button>
      </div>

    </div>

      {/* Version number */}
      <div className="relative z-10 mb-4">
        <p className="text-xs text-gray-800">v.0.01a</p>
      </div>

    </div>
  )
}

