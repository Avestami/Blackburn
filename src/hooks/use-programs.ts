'use client'

import { useState, useEffect } from 'react'

interface Program {
  id: string
  title: string
  description: string
  category: string
  level: string
  duration: number
  price: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  enrolled?: number
  rating?: string
}

interface ProgramsResponse {
  programs: Program[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

interface UseProgramsOptions {
  category?: string
  level?: string
  limit?: number
  offset?: number
  includeInactive?: boolean
}

export function usePrograms(options: UseProgramsOptions = {}) {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  })

  const fetchPrograms = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (options.category) params.append('category', options.category)
      if (options.level) params.append('level', options.level)
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.offset) params.append('offset', options.offset.toString())
      if (options.includeInactive) params.append('includeInactive', 'true')
      
      const response = await fetch(`/api/programs?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch programs')
      }
      
      const data: ProgramsResponse = await response.json()
      setPrograms(data.programs)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrograms()
  }, [options.category, options.level, options.limit, options.offset, options.includeInactive])

  const refetch = () => {
    fetchPrograms()
  }

  // Helper function to get difficulty color based on level
  const getDifficultyColor = (level: string) => {
    if (!level) return 'bg-gray-600'
    switch (level.toLowerCase()) {
      case 'beginner': return 'bg-green-600'
      case 'intermediate': return 'bg-yellow-600'
      case 'advanced': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  // Helper function to get program icon based on category
  const getProgramIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'strength': return 'Dumbbell'
      case 'cardio': return 'Zap'
      case 'athletic': return 'Target'
      case 'wellness': return 'Heart'
      default: return 'Dumbbell'
    }
  }

  // Helper function to format duration
  const formatDuration = (duration: number) => {
    if (duration === 0) return 'Ongoing'
    return `${duration} weeks`
  }

  return {
    programs,
    loading,
    error,
    pagination,
    refetch,
    getDifficultyColor,
    getProgramIcon,
    formatDuration
  }
}