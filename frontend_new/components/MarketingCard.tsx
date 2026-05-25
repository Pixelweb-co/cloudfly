import React from 'react'

export const MarketingCard: React.FC = () => {
  return (
    <div className="bg-gray-900 rounded-xl shadow-lg p-6 max-w-2xl w-full hover:shadow-2xl transition-shadow duration-300">
      <h2 className="text-2xl font-semibold mb-4 text-indigo-400">AI Powered Campaigns</h2>
      <p className="mb-4 text-gray-300">
        Generate personalized WhatsApp campaigns using AI. Review performance metrics and manage contacts in real time.
      </p>
      <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded transition-colors duration-200">
        Open Campaign Manager
      </button>
    </div>
  )
}
