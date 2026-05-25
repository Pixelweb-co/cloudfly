import React from 'react'
import { MarketingCard } from '@/components/MarketingCard'

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-bold mb-8">Marketing AI Bot Dashboard</h1>
      <MarketingCard />
    </div>
  )
}
