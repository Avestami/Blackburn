'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Profile {
  id?: string
  userId: string
  age?: number
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  height?: number
  activityLevel?: 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE' | 'EXTREMELY_ACTIVE'
  fitnessGoals?: string[]
  medicalHistory?: string
  emergencyContact?: string
  createdAt?: string
  updatedAt?: string
}

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: string
  profile?: Profile
}

interface ProfileData {
  user: User
}

export function useProfile() {
  const { data: session } = useSession()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    if (!session?.user?.email) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/user/profile')
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      
      const data = await response.json()
      setProfileData(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<Profile & { firstName?: string; lastName?: string }>) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update profile')
      }
      
      // Refresh profile data after update
      await fetchProfile()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [session])

  return {
    profileData,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile
  }
}