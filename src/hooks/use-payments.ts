'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface PaymentMethod {
  id: string
  type: string
  last4: string
  brand: string
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
}

interface Payment {
  id: string
  amount: number
  currency: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  receiptUrl?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
  program: {
    id: string
    name: string
    price: number
  }
}

interface PaymentData {
  payments: Payment[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface PaymentStats {
  totalSpent: number
  totalTransactions: number
  completedPayments: number
  pendingPayments: number
}

export function usePayments() {
  const { data: session } = useSession()
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchPayments = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      const response = await fetch('/api/payments?limit=50')
      
      if (!response.ok) {
        throw new Error('Failed to fetch payments')
      }

      const data = await response.json()
      setPaymentData(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [session?.user?.id])

  // Transform payments for display
  const transformedPayments = paymentData?.payments?.map(payment => ({
    id: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status.toLowerCase(),
    description: payment.program.name,
    date: new Date(payment.createdAt).toISOString(),
    method: 'Card Payment', // Since we don't have payment method details in the API
    receiptUrl: payment.receiptUrl,
    program: payment.program.name
  })) || []

  // Calculate payment statistics
  const paymentStats: PaymentStats = {
    totalSpent: transformedPayments
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + p.amount, 0),
    totalTransactions: transformedPayments.length,
    completedPayments: transformedPayments.filter(p => p.status === 'approved').length,
    pendingPayments: transformedPayments.filter(p => p.status === 'pending').length
  }

  // Mock payment methods since we don't have this in the API yet
  const mockPaymentMethods: PaymentMethod[] = [
    {
      id: '1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true
    }
  ]

  // Mock upcoming payments - in a real app, this would come from subscriptions
  const upcomingPayments = transformedPayments
    .filter(p => p.status === 'pending')
    .map(p => ({
      id: `upcoming_${p.id}`,
      amount: p.amount,
      currency: p.currency,
      description: p.description,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      method: 'Visa ****4242'
    }))

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'CheckCircle'
      case 'pending':
        return 'Clock'
      case 'rejected':
      case 'failed':
      case 'cancelled':
        return 'XCircle'
      default:
        return 'Clock'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'bg-green-600'
      case 'pending':
        return 'bg-yellow-600'
      case 'rejected':
      case 'failed':
      case 'cancelled':
        return 'bg-red-600'
      default:
        return 'bg-gray-600'
    }
  }

  const formatPaymentStatus = (status: string) => {
    switch (status) {
      case 'approved':
        return 'completed'
      case 'rejected':
        return 'failed'
      case 'cancelled':
        return 'cancelled'
      default:
        return status
    }
  }

  const createPayment = async (paymentData: {
    programId: string
    amount: number
    currency: string
    receiptUrl?: string
    notes?: string
  }) => {
    try {
      setSubmitting(true)
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      })

      if (!response.ok) {
        throw new Error('Failed to create payment')
      }

      const newPayment = await response.json()
      await fetchPayments() // Refresh the payments list
      return newPayment
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payment')
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  return {
    paymentData,
    transformedPayments,
    paymentMethods: mockPaymentMethods,
    upcomingPayments,
    paymentStats,
    loading,
    error,
    submitting,
    getStatusIcon,
    getStatusColor,
    formatPaymentStatus,
    createPayment,
    refetch: fetchPayments
  }
}