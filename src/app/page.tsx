'use client'

import dynamic from 'next/dynamic'
import { WagmiConfig } from 'wagmi'
import { Web3Modal } from '@web3modal/react'
import { wagmiClient, ethereumClient, projectId } from '@/config/web3modal'

// Dynamically import SwapInterface with no SSR
const SwapInterface = dynamic(
  () => import('@/components/SwapInterface'),
  { ssr: false }
)

export default function Home() {
  return (
    <WagmiConfig config={wagmiClient}>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 py-16">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Crypto Swap</h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              The easiest way to swap tokens across Ethereum and BSC networks with the best rates
            </p>
          </header>
          
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-1">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                <SwapInterface />
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-6 px-4">
              <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="text-blue-500 font-semibold mb-2">Multi-Chain</div>
                <p className="text-gray-600 text-sm">Support for multiple blockchain networks</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="text-blue-500 font-semibold mb-2">Best Rates</div>
                <p className="text-gray-600 text-sm">Aggregated prices from multiple DEXs</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="text-blue-500 font-semibold mb-2">Secure</div>
                <p className="text-gray-600 text-sm">Direct wallet integration with MetaMask</p>
              </div>
            </div>
          </div>

          <footer className="mt-12 text-center text-gray-500 text-sm">
            <p>Powered by Web3Modal and Wagmi</p>
          </footer>
        </div>
      </div>
      <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
    </WagmiConfig>
  )
} 
