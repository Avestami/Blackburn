"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, User, Trophy, Target, Calendar, TrendingUp } from "lucide-react"

interface UserProfile {
  id: string
  username: string
  firstName: string
  lastName: string
  email: string
  joinDate: string
  isActive: boolean
  stats: {
    totalWorkouts: number
    currentStreak: number
    totalWeight: number
    programsCompleted: number
    achievements: number
  }
  currentPrograms: string[]
  recentActivity: {
    date: string
    activity: string
    details: string
  }[]
}

export default function UserSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)

  // Mock data - in real app, this would be an API call
  const mockUsers: UserProfile[] = [
    {
      id: "user_001",
      username: "fitness_john",
      firstName: "John",
      lastName: "Smith",
      email: "john@example.com",
      joinDate: "2023-06-15",
      isActive: true,
      stats: {
        totalWorkouts: 156,
        currentStreak: 12,
        totalWeight: 2340,
        programsCompleted: 3,
        achievements: 8
      },
      currentPrograms: ["Strength Builder Pro", "Fat Burn Accelerator"],
      recentActivity: [
        {
          date: "2024-02-01",
          activity: "Completed Workout",
          details: "Upper Body Strength - 45 mins"
        },
        {
          date: "2024-01-31",
          activity: "Weight Update",
          details: "Lost 2 lbs - Total: 180 lbs"
        },
        {
          date: "2024-01-30",
          activity: "Achievement Unlocked",
          details: "30-Day Streak Master"
        }
      ]
    },
    {
      id: "user_002",
      username: "sarah_fit",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah@example.com",
      joinDate: "2023-08-22",
      isActive: true,
      stats: {
        totalWorkouts: 89,
        currentStreak: 7,
        totalWeight: 1890,
        programsCompleted: 2,
        achievements: 5
      },
      currentPrograms: ["Wellness & Mobility"],
      recentActivity: [
        {
          date: "2024-02-01",
          activity: "Completed Workout",
          details: "Yoga Flow - 30 mins"
        },
        {
          date: "2024-01-30",
          activity: "Program Started",
          details: "Wellness & Mobility Program"
        }
      ]
    },
    {
      id: "user_003",
      username: "mike_gains",
      firstName: "Mike",
      lastName: "Wilson",
      email: "mike@example.com",
      joinDate: "2023-04-10",
      isActive: false,
      stats: {
        totalWorkouts: 234,
        currentStreak: 0,
        totalWeight: 3120,
        programsCompleted: 5,
        achievements: 12
      },
      currentPrograms: [],
      recentActivity: [
        {
          date: "2024-01-15",
          activity: "Completed Program",
          details: "Athletic Performance Program"
        }
      ]
    }
  ]

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    
    // Simulate API delay
    setTimeout(() => {
      const results = mockUsers.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setSearchResults(results)
      setIsSearching(false)
    }, 500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Users
          </CardTitle>
          <CardDescription className="text-gray-300">
            Search by username, name, or user ID to view profiles and track progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter username, name, or user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-gray-800/50 border-red-500/30 text-white placeholder-gray-400"
            />
            <Button 
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
          <CardHeader>
            <CardTitle className="text-white">Search Results ({searchResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchResults.map((user) => (
                <div 
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-red-500/20 cursor-pointer hover:bg-gray-800/50 transition-colors"
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-red-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-gray-300 text-sm">@{user.username}</div>
                      <div className="text-gray-400 text-xs">ID: {user.id}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-white text-sm">{user.stats.totalWorkouts} workouts</div>
                      <div className="text-gray-300 text-xs">{user.stats.currentStreak} day streak</div>
                    </div>
                    <Badge className={user.isActive ? 'bg-green-600' : 'bg-gray-600'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Profile Details */}
      {selectedUser && (
        <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-white">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    @{selectedUser.username} • Joined {new Date(selectedUser.joinDate).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedUser(null)}
                className="border-red-500/30 text-red-400 hover:bg-red-600/20"
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-800/30 rounded-lg">
                <Target className="h-6 w-6 text-red-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">{selectedUser.stats.totalWorkouts}</div>
                <div className="text-sm text-gray-300">Total Workouts</div>
              </div>
              
              <div className="text-center p-3 bg-gray-800/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">{selectedUser.stats.currentStreak}</div>
                <div className="text-sm text-gray-300">Current Streak</div>
              </div>
              
              <div className="text-center p-3 bg-gray-800/30 rounded-lg">
                <Trophy className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">{selectedUser.stats.programsCompleted}</div>
                <div className="text-sm text-gray-300">Programs Done</div>
              </div>
              
              <div className="text-center p-3 bg-gray-800/30 rounded-lg">
                <Trophy className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">{selectedUser.stats.achievements}</div>
                <div className="text-sm text-gray-300">Achievements</div>
              </div>
            </div>

            {/* Current Programs */}
            <div>
              <h3 className="text-white font-semibold mb-3">Current Programs</h3>
              {selectedUser.currentPrograms.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedUser.currentPrograms.map((program, index) => (
                    <Badge key={index} className="bg-red-600">
                      {program}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No active programs</p>
              )}
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-white font-semibold mb-3">Recent Activity</h3>
              <div className="space-y-3">
                {selectedUser.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg">
                    <Calendar className="h-4 w-4 text-red-400 mt-1" />
                    <div className="flex-1">
                      <div className="text-white font-medium">{activity.activity}</div>
                      <div className="text-gray-300 text-sm">{activity.details}</div>
                      <div className="text-gray-400 text-xs">
                        {new Date(activity.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {searchQuery && searchResults.length === 0 && !isSearching && (
        <Card className="bg-gray-900/95 backdrop-blur-md border-red-500/30">
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No users found matching "{searchQuery}"</p>
            <p className="text-gray-500 text-sm mt-2">Try searching with a different username or user ID</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}