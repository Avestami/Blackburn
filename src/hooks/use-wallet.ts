'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface WalletTransaction {
  id: string
  type: 'CREDIT' | 'DEBIT'
  amount: number
  description: string
  createdAt: string
  referenceType?: string
}

interface WalletData {
  id: string
  balance: number
  userId: string
  createdAt: string
  updatedAt: string
}

interface WalletSummary {
  totalEarnings: number
  totalWithdrawals: number
  pendingWithdrawals: number
  availableBalance: number
}

interface WalletResponse {
  wallet: WalletData
  transactions: WalletTransaction[]
  summary: WalletSummary
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

interface WithdrawalRequest {
  amount: number
  method: 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'PAYPAL'
  accountDetails: {
    accountNumber: string
    accountName: string
    bankName?: string
    routingNumber?: string
  }
  notes?: string
}

export function useWallet() {
  const { data: session, status } = useSession()
  const [walletData, setWalletData] = useState<WalletResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchWalletData = async () => {
    if (status !== 'authenticated') return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/user/wallet')
      
      if (!response.ok) {
        throw new Error('Failed to fetch wallet data')
      }
      
      const data = await response.json()
      setWalletData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const requestWithdrawal = async (withdrawalData: WithdrawalRequest) => {
    try {
      setSubmitting(true)
      setError(null)
      
      const response = await fetch('/api/user/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(withdrawalData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to request withdrawal')
      }
      
      const result = await response.json()
      
      // Refresh wallet data after successful withdrawal
      await fetchWalletData()
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'CREDIT':
        return 'credit'
      case 'DEBIT':
        return 'debit'
      default:
        return type.toLowerCase()
    }
  }

  const formatTransactionDescription = (description: string, type: string) => {
    // Map common transaction descriptions to user-friendly names
    const descriptionMap: { [key: string]: string } = {
      'Referral bonus': 'Referral Bonus',
      'Program purchase': 'Program Purchase',
      'Achievement reward': 'Achievement Reward',
      'Wallet top-up': 'Wallet Top-up',
      'Withdrawal request': 'Withdrawal Request'
    }
    
    return descriptionMap[description] || description
  }

  useEffect(() => {
    fetchWalletData()
  }, [status])

  return {
    walletData,
    loading,
    error,
    submitting,
    fetchWalletData,
    requestWithdrawal,
    formatTransactionType,
    formatTransactionDescription
  }
}