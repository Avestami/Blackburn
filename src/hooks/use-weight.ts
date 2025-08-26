'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface WeightEntry {
  id: string
  userId: string
  weight: number
  notes?: string
  bmi?: number
  bmiCategory?: string
  createdAt: string
  updatedAt: string
}

interface WeightData {
  entries: WeightEntry[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export function useWeight(limit: number = 30) {
  const { data: session } = useSession()
  const [weightData, setWeightData] = useState<WeightData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const fetchWeightData = async () => {
    if (!session?.user?.email) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/user/weight?limit=${limit}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch weight data')
      }
      
      const data = await response.json()
      setWeightData(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const addWeightEntry = async (weight: number, notes?: string) => {
    try {
      setIsAdding(true)
      const response = await fetch('/api/user/weight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ weight, notes }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to add weight entry')
      }
      
      // Refresh weight data after adding
      await fetchWeightData()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    } finally {
      setIsAdding(false)
    }
  }

  const getWeightStats = () => {
    if (!weightData?.entries || weightData.entries.length === 0) {
      return {
        currentWeight: 0,
        startWeight: 0,
        totalChange: 0,
        totalEntries: 0,
        latestBMI: null,
        latestBMICategory: null
      }
    }

    const entries = weightData.entries
    const currentWeight = entries[0]?.weight || 0 // Most recent (first in desc order)
    const startWeight = entries[entries.length - 1]?.weight || 0 // Oldest (last in desc order)
    const totalChange = currentWeight - startWeight
    const latestEntry = entries[0]

    return {
      currentWeight,
      startWeight,
      totalChange,
      totalEntries: weightData.pagination.total,
      latestBMI: latestEntry?.bmi || null,
      latestBMICategory: latestEntry?.bmiCategory || null
    }
  }

  const getWeightEntriesWithChange = () => {
    if (!weightData?.entries) return []
    
    return weightData.entries.map((entry, index) => {
      const nextEntry = weightData.entries[index + 1] // Next entry (older)
      const change = nextEntry ? entry.weight - nextEntry.weight : 0
      
      return {
        ...entry,
        change
      }
    })
  }

  useEffect(() => {
    fetchWeightData()
  }, [session, limit])

  return {
    weightData,
    loading,
    error,
    isAdding,
    refetch: fetchWeightData,
    addWeightEntry,
    getWeightStats,
    getWeightEntriesWithChange
  }
}