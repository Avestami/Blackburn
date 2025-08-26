'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search, Dumbbell, Zap, Target, Heart, Clock, Users, Star } from 'lucide-react'
import { usePrograms } from '@/hooks/use-programs'
import { toast } from 'sonner'

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
}

export default function ProgramsPage() {
  const { data: session } = useSession()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [levelFilter, setLevelFilter] = useState<string>('')
  const [subscribingTo, setSubscribingTo] = useState<string | null>(null)

  const { 
    programs, 
    loading, 
    error, 
    pagination, 
    refetch,
    getDifficultyColor,
    getProgramIcon,
    formatDuration
  } = usePrograms({
    category: categoryFilter || undefined,
    level: levelFilter || undefined,
    limit: 12
  })

  useEffect(() => {
    refetch()
  }, [categoryFilter, levelFilter, refetch])

  const filteredPrograms = programs.filter(program =>
    program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubscribe = async (programId: string, programName: string, price: number) => {
    if (!session) {
      toast.error('Please sign in to subscribe to programs')
      return
    }

    setSubscribingTo(programId)
    try {
      const response = await fetch('/api/user/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          programId,
          paymentAmount: price
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to subscribe')
      }

      toast.success(`Successfully subscribed to ${programName}!`)
      // Optionally redirect to payments page
      // router.push('/payments')
    } catch (error) {
      console.error('Subscription error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to subscribe to program')
    } finally {
      setSubscribingTo(null)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'strength': return <Dumbbell className="h-5 w-5" />
      case 'cardio': return <Zap className="h-5 w-5" />
      case 'athletic': return <Target className="h-5 w-5" />
      case 'wellness': return <Heart className="h-5 w-5" />
      default: return <Dumbbell className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-red-500" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Programs</h1>
            <p className="text-gray-400 mb-4">{error}</p>
            <Button onClick={refetch} className="bg-red-600 hover:bg-red-700">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
            Fitness Programs
          </h1>
          <p className="text-gray-400 text-lg">
            Discover our comprehensive fitness programs designed to help you achieve your goals.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-red-500"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              <SelectItem value="">All Categories</SelectItem>
              <SelectItem value="strength">Strength</SelectItem>
              <SelectItem value="cardio">Cardio</SelectItem>
              <SelectItem value="athletic">Athletic</SelectItem>
              <SelectItem value="wellness">Wellness</SelectItem>
            </SelectContent>
          </Select>

          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              <SelectItem value="">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Programs Grid */}
        {filteredPrograms.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Programs Found</h3>
            <p className="text-gray-500">
              {searchTerm || categoryFilter || levelFilter
                ? 'Try adjusting your filters to see more programs.'
                : 'No programs are currently available.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map((program) => (
              <Card key={program.id} className="bg-gray-900 border-gray-700 hover:border-red-500 transition-all duration-300 group">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(program.category)}
                      <Badge 
                        variant="outline" 
                        className={`${getDifficultyColor(program.level)} border-current`}
                      >
                        {program.level}
                      </Badge>
                    </div>
                    <Badge variant="secondary" className="bg-gray-800 text-gray-300">
                      {program.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-white group-hover:text-red-400 transition-colors">
                    {program.title}
                  </CardTitle>
                  <CardDescription className="text-gray-400 line-clamp-2">
                    {program.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(program.duration)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>4.8</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-white">
                        ${program.price}
                        <span className="text-sm text-gray-400 font-normal">/program</span>
                      </div>
                      <Button
                        onClick={() => handleSubscribe(program.id, program.title, program.price)}
                        disabled={subscribingTo === program.id}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {subscribingTo === program.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Subscribing...
                          </>
                        ) : (
                          'Subscribe'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load More */}
        {pagination.hasMore && (
          <div className="text-center mt-8">
            <Button
              onClick={() => {
                // Implement load more functionality if needed
                toast.info('Load more functionality coming soon!')
              }}
              variant="outline"
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              Load More Programs
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}