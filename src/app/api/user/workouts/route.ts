import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Workout creation schema
const createWorkoutSchema = z.object({
  name: z.string().min(1, "Workout name is required").max(100, "Name must be less than 100 characters"),
  type: z.enum(["strength", "cardio", "flexibility", "sports", "other"]),
  duration: z.number().min(1, "Duration must be at least 1 minute").max(600, "Duration cannot exceed 10 hours"),
  caloriesBurned: z.number().min(0, "Calories burned cannot be negative").optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
  exercises: z.array(z.object({
    name: z.string().min(1, "Exercise name is required"),
    sets: z.number().min(1, "Sets must be at least 1").optional(),
    reps: z.number().min(1, "Reps must be at least 1").optional(),
    weight: z.number().min(0, "Weight cannot be negative").optional(),
    duration: z.number().min(1, "Duration must be at least 1 second").optional(),
    distance: z.number().min(0, "Distance cannot be negative").optional(),
    restTime: z.number().min(0, "Rest time cannot be negative").optional(),
    notes: z.string().max(200, "Exercise notes must be less than 200 characters").optional()
  })).optional()
})

// GET /api/user/workouts - Get user's workout history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")
    const type = searchParams.get("type")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Build where clause
    const whereClause: {
      userId: string
      type?: string
      completedAt?: { gte?: Date; lte?: Date }
    } = {
      userId: user.id
    }

    if (type) {
      whereClause.type = type
    }

    if (startDate || endDate) {
      whereClause.completedAt = {}
      if (startDate) {
        whereClause.completedAt.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.completedAt.lte = new Date(endDate)
      }
    }

    // Get workouts with exercises
    const workouts = await prisma.workout.findMany({
      where: whereClause,
      include: {
        exercises: {
          orderBy: { order: "asc" }
        }
      },
      orderBy: { completedAt: "desc" },
      take: limit,
      skip: offset
    })

    const totalCount = await prisma.workout.count({
      where: whereClause
    })

    // Calculate workout statistics
    const stats = await prisma.workout.aggregate({
      where: { userId: user.id },
      _sum: {
        duration: true,
        caloriesBurned: true
      },
      _count: {
        id: true
      }
    })

    // Get workout type distribution
    const typeDistribution = await prisma.workout.groupBy({
      by: ['type'],
      where: { userId: user.id },
      _count: {
        id: true
      }
    })

    // Calculate weekly stats (last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const weeklyStats = await prisma.workout.aggregate({
      where: {
        userId: user.id,
        completedAt: {
          gte: weekAgo
        }
      },
      _sum: {
        duration: true,
        caloriesBurned: true
      },
      _count: {
        id: true
      }
    })

    return NextResponse.json({
      workouts,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      stats: {
        totalWorkouts: stats._count.id || 0,
        totalDuration: stats._sum.duration || 0,
        totalCalories: stats._sum.caloriesBurned || 0,
        averageDuration: stats._count.id ? Math.round((stats._sum.duration || 0) / stats._count.id) : 0,
        typeDistribution: typeDistribution.map((item: any) => ({
          type: item.type,
          count: item._count.id
        })),
        weeklyStats: {
          workouts: weeklyStats._count.id || 0,
          duration: weeklyStats._sum.duration || 0,
          calories: weeklyStats._sum.caloriesBurned || 0
        }
      }
    })
  } catch (error) {
    console.error("Workouts fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/user/workouts - Create a new workout
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createWorkoutSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create workout with exercises in a transaction
    const workout = await prisma.$transaction(async (tx: any) => {
      // Create the workout
      const newWorkout = await tx.workout.create({
        data: {
          userId: user.id,
          name: validatedData.name,
          type: validatedData.type,
          duration: validatedData.duration,
          caloriesBurned: validatedData.caloriesBurned,
          notes: validatedData.notes,
          completedAt: new Date()
        }
      })

      // Create exercises if provided
      if (validatedData.exercises && validatedData.exercises.length > 0) {
        const exerciseData = validatedData.exercises.map((exercise, index) => ({
          workoutId: newWorkout.id,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
          duration: exercise.duration,
          distance: exercise.distance,
          restTime: exercise.restTime,
          notes: exercise.notes,
          order: index + 1
        }))

        await tx.exercise.createMany({
          data: exerciseData
        })
      }

      // Return workout with exercises
      return await tx.workout.findUnique({
        where: { id: newWorkout.id },
        include: {
          exercises: {
            orderBy: { order: "asc" }
          }
        }
      })
    })

    return NextResponse.json({
      message: "Workout created successfully",
      workout
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    console.error("Workout creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}