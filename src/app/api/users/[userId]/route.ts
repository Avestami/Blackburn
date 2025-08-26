import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Get user profile with fitness data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const currentUserId = session.user.id;

    // Check if users are friends or if viewing own profile
    let canViewProfile = userId === currentUserId;

    if (!canViewProfile) {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: currentUserId, receiverId: userId, status: 'ACCEPTED' },
            { requesterId: userId, receiverId: currentUserId, status: 'ACCEPTED' }
          ]
        }
      });
      canViewProfile = !!friendship;
    }

    if (!canViewProfile) {
      return NextResponse.json({ error: 'You can only view profiles of friends' }, { status: 403 });
    }

    // Get user profile data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        profile: {
          select: {
            age: true,
            gender: true,
            height: true,
            activityLevel: true,
            profilePicture: true,
            isOnboarded: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get fitness statistics
    const [weights, workouts, fitnessGoals] = await Promise.all([
      // Recent weight entries
      prisma.weight.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Recent workouts
      prisma.workout.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          exercises: {
            select: {
              name: true,
              sets: true,
              reps: true,
              weight: true,
              duration: true
            }
          }
        }
      }),
      
      // Fitness goals
      prisma.fitnessGoal.findMany({
        where: { userId },
        include: {
          progress: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      })
    ]);

    // Calculate workout statistics
    const totalWorkouts = await prisma.workout.count({
      where: { userId }
    });

    const totalCaloriesBurned = await prisma.workout.aggregate({
      where: { userId },
      _sum: {
        caloriesBurned: true
      }
    });

    const totalWorkoutTime = await prisma.workout.aggregate({
      where: { userId },
      _sum: {
        duration: true
      }
    });

    // Get current weight (latest entry)
    const currentWeight = weights[0];
    
    // Calculate weight progress (difference from first to latest)
    const firstWeight = weights[weights.length - 1];
    const weightProgress = currentWeight && firstWeight ? 
      currentWeight.weight - firstWeight.weight : null;

    // Get friendship status if not viewing own profile
    let friendshipStatus = null;
    if (userId !== currentUserId) {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: currentUserId, receiverId: userId },
            { requesterId: userId, receiverId: currentUserId }
          ]
        }
      });
      
      if (friendship) {
        friendshipStatus = {
          status: friendship.status.toLowerCase(),
          friendshipId: friendship.id,
          friendsSince: friendship.status === 'ACCEPTED' ? friendship.updatedAt : null
        };
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        memberSince: user.createdAt,
        profile: user.profile
      },
      statistics: {
        totalWorkouts,
        totalCaloriesBurned: totalCaloriesBurned._sum.caloriesBurned || 0,
        totalWorkoutTime: totalWorkoutTime._sum.duration || 0,
        currentWeight: currentWeight?.weight,
        weightProgress,
        activeGoals: fitnessGoals.filter(goal => goal.status === 'active').length
      },
      recentData: {
        weights: weights.slice(0, 5), // Last 5 weight entries
        workouts: workouts.slice(0, 5), // Last 5 workouts
        goals: fitnessGoals.filter(goal => goal.status === 'active').slice(0, 3) // Active goals
      },
      friendshipStatus
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}