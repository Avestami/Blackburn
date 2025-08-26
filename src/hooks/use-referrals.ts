'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface ReferredUser {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  createdAt: string
}

interface Referral {
  id: string
  referralCode: string
  status: string
  createdAt: string
  referredUser: ReferredUser
  earnings?: number
  program?: string
}

interface ReferralStats {
  totalReferrals: number
  successfulReferrals: number
  pendingReferrals: number
  totalEarnings: number
}

interface ReferralData {
  referralStats: ReferralStats
  referrals: Referral[]
  wallet?: {
    id: string
    balance: number
  }
}

interface CreateReferralRequest {
  referredEmail: string
  referredName: string
}

export function useReferrals() {
  const { data: session, status } = useSession()
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Generate user's referral code based on their ID or email
  const generateReferralCode = (userId: string) => {
    return `BLACKBURN${userId.slice(-6).toUpperCase()}`
  }

  const fetchReferralData = async () => {
    if (status !== 'authenticated') return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/referral')
      
      if (!response.ok) {
        throw new Error('Failed to fetch referral data')
      }
      
      const data = await response.json()
      
      // Transform the API response to match the expected format
      const transformedData = {
        referralCode: data.referralCode,
        referredBy: data.referredBy,
        referralStats: {
          totalReferrals: data.stats.totalReferrals,
          successfulReferrals: data.referrals.filter((ref: any) => ref.cashbackPaid).length,
          pendingReferrals: data.referrals.filter((ref: any) => !ref.cashbackPaid).length,
          totalEarnings: data.stats.totalCashback / 100 // Convert from IRT to display currency
        },
        referrals: data.referrals.map((ref: any) => ({
          id: ref.id,
          referralCode: ref.referralCode,
          status: ref.cashbackPaid ? 'COMPLETED' : 'PENDING',
          createdAt: ref.createdAt,
          referredUser: ref.referredUser
        }))
      }
      
      setReferralData(transformedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const createReferral = async (referralRequest: CreateReferralRequest) => {
    try {
      setSubmitting(true)
      setError(null)
      
      const response = await fetch('/api/user/referrals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(referralRequest),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create referral')
      }
      
      const result = await response.json()
      
      // Refresh referral data after successful creation
      await fetchReferralData()
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      return false
    }
  }

  const formatReferralStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'active'
      case 'pending':
        return 'pending'
      case 'active':
        return 'active'
      default:
        return status.toLowerCase()
    }
  }

  const calculateEarnings = (referral: Referral) => {
    // Mock earnings calculation - in real app this would come from backend
    if (referral.status === 'COMPLETED') {
      return 25.00 // Standard referral bonus
    }
    return 0.00
  }

  const getReferralLink = (referralCode: string) => {
    return `${window.location.origin}/signup?ref=${referralCode}`
  }

  // Transform backend data to match frontend expectations
  const transformedReferrals = referralData?.referrals?.map(referral => ({
    ...referral,
    name: `${referral.referredUser.firstName || ''} ${referral.referredUser.lastName || ''}`.trim() || 'Unknown User',
    email: referral.referredUser.email,
    joinDate: referral.createdAt,
    status: formatReferralStatus(referral.status),
    earnings: calculateEarnings(referral),
    program: 'Fitness Program' // Mock program name
  })) || []

  useEffect(() => {
    fetchReferralData()
  }, [status])

  return {
    referralData,
    transformedReferrals,
    loading,
    error,
    submitting,
    fetchReferralData,
    createReferral,
    copyToClipboard,
    generateReferralCode,
    getReferralLink,
    formatReferralStatus
  }
}