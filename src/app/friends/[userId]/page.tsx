'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Calendar, 
  Target, 
  Activity, 
  TrendingUp, 
  Weight, 
  Clock,
  Flame,
  Users,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UserProfile {
  user: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    memberSince: string;
    profile: {
      age?: number;
      gender?: string;
      height?: number;
      activityLevel?: string;
      profilePicture?: string;
      isOnboarded: boolean;
    } | null;
  };
  statistics: {
    totalWorkouts: number;
    totalCaloriesBurned: number;
    totalWorkoutTime: number;
    currentWeight?: number;
    weightProgress?: number;
    activeGoals: number;
  };
  recentData: {
    weights: Array<{
      id: string;
      weight: number;
      createdAt: string;
    }>;
    workouts: Array<{
      id: string;
      name: string;
      type: string;
      duration?: number;
      caloriesBurned?: number;
      createdAt: string;
    }>;
    goals: Array<{
      id: string;
      title: string;
      targetValue?: number;
      currentValue: number;
      unit?: string;
      category: string;
    }>;
  };
  friendshipStatus?: {
    status: string;
    friendshipId: string;
    friendsSince?: string;
  } | null;
}

export default function UserProfilePage() {
  const { t } = useLanguage();
  const params = useParams();
  const userId = params.userId as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch profile');
        }
        
        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError(error instanceof Error ? error.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const getDisplayName = (user: UserProfile['user']) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username || user.firstName || user.lastName || 'Unknown User';
  };

  const getInitials = (user: UserProfile['user']) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    const name = user.username || user.firstName || user.lastName || 'U';
    return name.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Prepare weight chart data
  const weightChartData = profile?.recentData.weights
    .slice()
    .reverse()
    .map((weight, index) => ({
      date: formatDate(weight.createdAt),
      weight: weight.weight,
      index
    })) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Error Loading Profile</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Link href="/friends">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Friends
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Profile Not Found</h3>
            <p className="text-muted-foreground mb-4">The user profile could not be found.</p>
            <Link href="/friends">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Friends
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/friends">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Friends
          </Button>
        </Link>
        {profile.friendshipStatus && (
          <Badge variant="default" className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>Friends since {formatDate(profile.friendshipStatus.friendsSince!)}</span>
          </Badge>
        )}
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage 
                src={profile.user.profile?.profilePicture || ''} 
                alt={getDisplayName(profile.user)} 
              />
              <AvatarFallback className="text-2xl">
                {getInitials(profile.user)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{getDisplayName(profile.user)}</h1>
              {profile.user.username && (
                <p className="text-lg text-muted-foreground">@{profile.user.username}</p>
              )}
              <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Member since {formatDate(profile.user.memberSince)}</span>
                </div>
                {profile.user.profile?.age && (
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{profile.user.profile.age} years old</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{profile.statistics.totalWorkouts}</p>
                <p className="text-sm text-muted-foreground">Total Workouts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Flame className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{profile.statistics.totalCaloriesBurned.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Calories Burned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{formatDuration(profile.statistics.totalWorkoutTime)}</p>
                <p className="text-sm text-muted-foreground">Workout Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{profile.statistics.activeGoals}</p>
                <p className="text-sm text-muted-foreground">Active Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="progress">Progress Charts</TabsTrigger>
          <TabsTrigger value="workouts">Recent Workouts</TabsTrigger>
          <TabsTrigger value="goals">Fitness Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          {/* Weight Progress Chart */}
          {weightChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Weight className="h-5 w-5" />
                  <span>Weight Progress</span>
                  {profile.statistics.weightProgress && (
                    <Badge variant={profile.statistics.weightProgress > 0 ? "destructive" : "default"}>
                      {profile.statistics.weightProgress > 0 ? '+' : ''}{profile.statistics.weightProgress.toFixed(1)} kg
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        dot={{ fill: '#8884d8' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Current Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.statistics.currentWeight && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Weight</p>
                      <p className="text-2xl font-bold">{profile.statistics.currentWeight} kg</p>
                    </div>
                    <Weight className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            )}
            
            {profile.user.profile?.height && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Height</p>
                      <p className="text-2xl font-bold">{profile.user.profile.height} cm</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="workouts" className="space-y-4">
          {profile.recentData.workouts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Recent Workouts</h3>
                <p className="text-muted-foreground">This user hasn't logged any workouts yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {profile.recentData.workouts.map((workout) => (
                <Card key={workout.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{workout.name}</h3>
                        <p className="text-sm text-muted-foreground">{workout.type}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(workout.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        {workout.duration && (
                          <p className="text-sm font-medium">{formatDuration(workout.duration)}</p>
                        )}
                        {workout.caloriesBurned && (
                          <p className="text-xs text-muted-foreground">{workout.caloriesBurned} cal</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          {profile.recentData.goals.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No Active Goals</h3>
                <p className="text-muted-foreground">This user doesn't have any active fitness goals.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {profile.recentData.goals.map((goal) => (
                <Card key={goal.id}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{goal.title}</h3>
                        <Badge variant="outline">{goal.category}</Badge>
                      </div>
                      {goal.targetValue && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ 
                                width: `${Math.min((goal.currentValue / goal.targetValue) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}