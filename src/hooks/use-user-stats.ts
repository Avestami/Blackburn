'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface UserStats {
  totalWorkouts: number
  totalDuration: number
  totalCalories: number
  averageDuration: number
  weeklyStats: {
    workouts: number
    duration: number
    calories: number
  }
  typeDistribution: {
    type: string
    count: number
  }[]
  memberSince?: string
  currentStreak: number
  programsEnrolled: number
}

export function useUserStats() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    if (!session?.user?.email) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Fetch workout stats
      const workoutResponse = await fetch('/api/user/workouts?limit=1')
      if (!workoutResponse.ok) {
        throw new Error('Failed to fetch workout stats')
      }
      const workoutData = await workoutResponse.json()
      
      // Fetch user profile for member since date
      const profileResponse = await fetch('/api/user/profile')
      if (!profileResponse.ok) {
        throw new Error('Failed to fetch profile')
      }
      const profileData = await profileResponse.json()
      
      // Calculate current streak (simplified - consecutive days with workouts)
      const currentStreak = await calculateStreak()
      
      // Get programs enrolled count (if programs API exists)
      const programsEnrolled = await getProgramsCount()
      
      const combinedStats: UserStats = {
        totalWorkouts: workoutData.stats?.totalWorkouts || 0,
        totalDuration: workoutData.stats?.totalDuration || 0,
        totalCalories: workoutData.stats?.totalCalories || 0,
        averageDuration: workoutData.stats?.averageDuration || 0,
        weeklyStats: workoutData.stats?.weeklyStats || { workouts: 0, duration: 0, calories: 0 },
        typeDistribution: workoutData.stats?.typeDistribution || [],
        memberSince: profileData.user?.createdAt || new Date().toISOString(),
        currentStreak,
        programsEnrolled
      }
      
      setStats(combinedStats)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const calculateStreak = async (): Promise<number> => {
    try {
      // Get recent workouts to calculate streak
      const response = await fetch('/api/user/workouts?limit=30')
      if (!response.ok) return 0
      
      const data = await response.json()
      const workouts = data.workouts || []
      
      if (workouts.length === 0) return 0
      
      // Simple streak calculation - consecutive days with workouts
      let streak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const workoutDates = workouts.map((w: { completedAt: string | Date }) => {
        const date = new Date(w.completedAt)
        date.setHours(0, 0, 0, 0)
        return date.getTime()
      })
      
      const uniqueDates = [...new Set<number>(workoutDates)].sort((a, b) => b - a)
      
      for (let i = 0; i < uniqueDates.length; i++) {
        const expectedDate = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000))
        if (uniqueDates[i] === expectedDate.getTime()) {
          streak++
        } else {
          break
        }
      }
      
      return streak
    } catch {
      return 0
    }
  }

  const getProgramsCount = async (): Promise<number> => {
    try {
      const response = await fetch('/api/programs')
      if (!response.ok) return 0
      
      const data = await response.json()
      // This would need to be filtered by user enrollment
      // For now, return a placeholder
      return 0
    } catch {
      return 0
    }
  }

  useEffect(() => {
    fetchStats()
  }, [session])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}