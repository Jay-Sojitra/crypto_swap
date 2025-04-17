'use client'

import React, { useState, useEffect } from 'react'
import { useAccount, useNetwork, useSwitchNetwork, useConnect, useBalance } from 'wagmi'
import { ethers, BrowserProvider } from 'ethers'
import axios from 'axios'
import { useIsMounted } from '@/hooks/useIsMounted'
import type { EIP1193Provider } from 'viem'
// import type { Address } from 'wagmi'

// Add window ethereum type with proper typing
declare global {
  interface Window {
    ethereum?: EIP1193Provider
  }
}

interface Token {
  address: string;
  symbol: string;
  decimals: number;
}

interface Chain {
  id: number;
  name: string;
  symbol: string;
}

interface RouteStep {
  pool: string;
  tokenIn: string;
  tokenOut: string;
  swapAmount: string;
  amountOut: string;
  fee: string;
}

interface QuoteResponse {
  price: string;
  estimatedGas: string;
  route: RouteStep[];
  amountOut: string;
  priceImpact: string;
  gas: string;
  amountOutMin: string;
}

interface KyberToken {
  address: string;
  chainId: number;
  decimals: number;
  logoURI: string;
  name: string;
  symbol: string;
}

interface KyberSwap {
  inputAmount: string;
  outputAmount: string;
  totalGas: number;
  gasPriceGwei: string;
  gasUsd: number;
  amountInUsd: number;
  amountOutUsd: number;
  receivedUsd: number;
  routerAddress: string;
  encodedSwapData: string;
  tokens: Record<string, KyberToken>;
  swaps: Array<{
    pool: string;
    tokenIn: string;
    tokenOut: string;
    swapAmount: string;
    amountOut: string;
    limitReturnAmount: string;
    maxPrice: string;
    exchange: string;
    poolLength: number;
    poolType: string;
  }>;
}

const CHAINS: Chain[] = [
  { id: 1, name: 'Ethereum', symbol: 'ETH' },
  { id: 56, name: 'Binance Smart Chain', symbol: 'BSC' },
]

const TOKENS: Record<number, Token[]> = {
  1: [
    { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'ETH', decimals: 18 },
    { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', decimals: 18 },
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 },
  ],
  56: [
    { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'BNB', decimals: 18 },
    { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', decimals: 18 },
    { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', decimals: 18 },
  ],
}

export default function SwapInterface() {
  const mounted = useIsMounted()
  const [selectedChain, setSelectedChain] = useState<number>(1)
  const [fromToken, setFromToken] = useState<Token>(TOKENS[1][0])
  const [toToken, setToToken] = useState<Token>(TOKENS[1][1])
  const [amount, setAmount] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [quote, setQuote] = useState<QuoteResponse | null>(null)

  const { address, isConnected } = useAccount()
  const { chain } = useNetwork()
  const { switchNetwork } = useSwitchNetwork()
  const { connect, connectors } = useConnect()

  // Get balance of the 'from' token
  const { data: balance } = useBalance({
    address,
    token: fromToken.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' 
      ? undefined 
      : (fromToken.address as `0x${string}`),
    chainId: selectedChain,
  })

  useEffect(() => {
    if (chain?.id !== selectedChain) {
      switchNetwork?.(selectedChain)
    }
  }, [selectedChain, chain?.id, switchNetwork])

  const handleChainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chainId = parseInt(e.target.value)
    setSelectedChain(chainId)
    setFromToken(TOKENS[chainId][0])
    setToToken(TOKENS[chainId][1])
    setQuote(null)
    setError('')
  }

  // Update address handling with proper hex check and type assertion
  const userAddress = address && ethers.isAddress(address) 
    ? (`0x${address.toLowerCase().slice(2)}` as `0x${string}`)
    : undefined

  const getQuote = async () => {
    if (!isConnected) {
      setError('Please connect your wallet')
      return
    }

    if (!amount || isNaN(Number(amount))) {
      setError('Please enter a valid amount')
      return
    }

    if (chain?.id !== selectedChain) {
      setError('Please switch to the correct network')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (!fromToken || !toToken || !amount || !userAddress) {
        console.error('Missing required parameters for quote')
        return
      }

      const amountIn = ethers.parseUnits(amount, fromToken.decimals).toString()

      const { data } = await axios.get<KyberSwap>(`https://aggregator-api.kyberswap.com/${selectedChain === 1 ? 'ethereum' : 'bsc'}/route/encode`, {
        params: {
          tokenIn: fromToken.address,
          tokenOut: toToken.address,
          amountIn: amountIn,
          to: userAddress,
          saveGas: 0,
          gasInclude: true,
          slippageTolerance: 50, // 0.5%
          chargeFeeBy: 'currency_in',
          isInBps: true,
          feeAmount: 0,
        }
      })

      console.log('Kyber API Response:', data)

      setQuote({
        price: data.outputAmount,
        estimatedGas: data.totalGas.toString(),
        route: [{
          pool: data.routerAddress,
          tokenIn: fromToken.address,
          tokenOut: toToken.address,
          swapAmount: data.encodedSwapData,
          amountOut: data.outputAmount,
          fee: '0'
        }],
        amountOut: data.outputAmount,
        priceImpact: data.gasUsd.toString(),
        gas: data.gasUsd.toString(),
        amountOutMin: data.outputAmount
      })
      
      // Check balance after getting quote
      if (balance && ethers.parseUnits(amount, fromToken.decimals) >= balance.value) {
        setError('Insufficient balance for swap')
      }
    } catch (error: unknown) {
      console.error('Swap quote error:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        console.log('API Error Response:', axiosError.response?.data)
        const errorMessage = axiosError.response?.data?.message || 'Failed to get swap quote'
        setError(errorMessage)
      } else if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Failed to get swap quote')
      }
    } finally {
      setLoading(false)
    }
  }

  const executeSwap = async () => {
    if (!quote || !amount) return;

    try {
      if (!window.ethereum) {
        throw new Error('Ethereum provider not found')
      }

      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      // Use the router address and encoded data from Kyber's response
      const tx = {
        to: quote.route[0].pool as `0x${string}`,
        data: quote.route[0].swapAmount,
        value: fromToken.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' 
          ? ethers.parseUnits(amount, fromToken.decimals)
          : BigInt(0),
        gasLimit: BigInt(quote.estimatedGas)
      }

      const receipt = await signer.sendTransaction(tx)
      console.log('Swap transaction successful:', receipt)
      
      setQuote(null)
      setAmount('')
    } catch (error) {
      console.error('Swap execution error:', error)
      if (error instanceof Error) {
        setError(`Failed to execute swap: ${error.message}`)
      } else {
        setError('Failed to execute swap')
      }
    }
  }

  // Safe formatting helper
  const safeFormatUnits = (value: string | bigint, decimals: number | string): string => {
    try {
      if (!value) return '0'
      // Handle decimal numbers
      if (typeof value === 'string' && value.includes('.')) {
        return value
      }
      return ethers.formatUnits(value, decimals)
    } catch (err) {
      console.error('Format error:', err)
      return '0'
    }
  }

  // Safe number formatting
  const safeFormatNumber = (value: string | number, decimals = 2): string => {
    try {
      if (!value) return '0'
      const num = Number(value)
      return isNaN(num) ? '0' : num.toFixed(decimals)
    } catch {
      return '0'
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="max-w-md mx-auto">
      {!isConnected ? (
        <div className="space-y-4">
          {connectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => connect({ connector })}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-600 transition-colors"
            >
              Connect with {connector.name}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Network</label>
            <select
              value={selectedChain}
              onChange={handleChainChange}
              className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              {CHAINS.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">You Pay</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <select
                value={fromToken.address}
                onChange={(e) => {
                  setFromToken(TOKENS[selectedChain].find(t => t.address === e.target.value)!)
                  setQuote(null)
                }}
                className="w-32 p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                {TOKENS[selectedChain].map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.symbol}
                  </option>
                ))}
              </select>
            </div>
            {balance && (
              <div className="mt-2 text-sm text-gray-500">
                Balance: {safeFormatUnits(balance.value, balance.decimals)} {balance.symbol}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">You Receive</label>
            <select
              value={toToken.address}
              onChange={(e) => {
                setToToken(TOKENS[selectedChain].find(t => t.address === e.target.value)!)
                setQuote(null)
              }}
              className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              {TOKENS[selectedChain].map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol}
                </option>
              ))}
            </select>
            {quote && quote.amountOut && (
              <div className="mt-2 text-sm text-gray-500">
                Expected: {safeFormatUnits(quote.amountOut, toToken.decimals)} {toToken.symbol}
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            onClick={quote ? executeSwap : getQuote}
            disabled={loading || !amount}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : quote ? 'Confirm Swap' : 'Get Quote'}
          </button>

          {quote && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <h3 className="font-medium text-gray-900 mb-2">Swap Details</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>Price Impact: {safeFormatNumber(quote.priceImpact)}%</div>
                <div>Estimated Gas: {quote.gas ? safeFormatUnits(quote.gas, 'gwei') : '0'} Gwei</div>
                {quote.amountOutMin && (
                  <div>Minimum Received: {safeFormatUnits(quote.amountOutMin, toToken.decimals)} {toToken.symbol}</div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
