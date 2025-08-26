import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Exercise update schema
const updateExerciseSchema = z.object({
  name: z.string().min(1, "Exercise name is required").max(100, "Name must be less than 100 characters").optional(),
  sets: z.number().min(1, "Sets must be at least 1").optional(),
  reps: z.number().min(1, "Reps must be at least 1").optional(),
  weight: z.number().min(0, "Weight cannot be negative").optional(),
  duration: z.number().min(1, "Duration must be at least 1 second").optional(),
  distance: z.number().min(0, "Distance cannot be negative").optional(),
  restTime: z.number().min(0, "Rest time cannot be negative").optional(),
  notes: z.string().max(200, "Exercise notes must be less than 200 characters").optional(),
  order: z.number().min(1, "Order must be at least 1").optional()
})

interface RouteParams {
  params: Promise<{ workoutId: string; id: string }>
}

// GET /api/user/workouts/[workoutId]/exercises/[id] - Get specific exercise
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { workoutId, id } = await params;
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if workout exists and belongs to user
    const workout = await prisma.workout.findFirst({
      where: {
        id: workoutId,
        userId: user.id
      }
    })

    if (!workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 })
    }

    // Get the specific exercise
    const exercise = await prisma.exercise.findFirst({
      where: {
        id: id,
        workoutId: workoutId
      }
    })

    if (!exercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 })
    }

    // Calculate exercise metrics
    const totalVolume = (exercise.sets || 0) * (exercise.reps || 0) * (exercise.weight || 0)
    const estimatedCalories = calculateEstimatedCalories(exercise)

    return NextResponse.json({
      exercise: {
        ...exercise,
        metrics: {
          totalVolume,
          estimatedCalories
        }
      },
      workout: {
        id: workout.id,
        name: workout.name,
        type: workout.type
      }
    })
  } catch (error) {
    console.error("Exercise fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/user/workouts/[workoutId]/exercises/[id] - Update exercise
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const { workoutId, id } = await params;
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateExerciseSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if workout exists and belongs to user
    const workout = await prisma.workout.findFirst({
      where: {
        id: workoutId,
        userId: user.id
      }
    })

    if (!workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 })
    }

    // Check if exercise exists
    const existingExercise = await prisma.exercise.findFirst({
      where: {
        id: id,
        workoutId: workoutId
      }
    })

    if (!existingExercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 })
    }

    // Update the exercise
    const updatedExercise = await prisma.exercise.update({
      where: { id: id },
      data: {
        ...validatedData,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: "Exercise updated successfully",
      exercise: updatedExercise
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    console.error("Exercise update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/user/workouts/[workoutId]/exercises/[id] - Delete exercise
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const { workoutId, id } = await params;
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if workout exists and belongs to user
    const workout = await prisma.workout.findFirst({
      where: {
        id: workoutId,
        userId: user.id
      }
    })

    if (!workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 })
    }

    // Check if exercise exists
    const existingExercise = await prisma.exercise.findFirst({
      where: {
        id: id,
        workoutId: workoutId
      }
    })

    if (!existingExercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 })
    }

    // Delete the exercise
    await prisma.exercise.delete({
      where: { id: id }
    })

    // Reorder remaining exercises to fill the gap
    const remainingExercises = await prisma.exercise.findMany({
      where: { workoutId: workoutId },
      orderBy: { order: "asc" }
    })

    // Update order for remaining exercises
    await prisma.$transaction(async (tx: any) => {
      for (let i = 0; i < remainingExercises.length; i++) {
        await tx.exercise.update({
          where: { id: remainingExercises[i].id },
          data: { order: i + 1 }
        })
      }
    })

    return NextResponse.json({
      message: "Exercise deleted successfully"
    })
  } catch (error) {
    console.error("Exercise deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to estimate calories burned for an exercise
function calculateEstimatedCalories(exercise: {
  duration?: number | null
  sets?: number | null
  reps?: number | null
}): number {
  // This is a simplified calculation - in a real app, you'd use more sophisticated formulas
  // based on exercise type, user weight, intensity, etc.
  
  let calories = 0
  
  if (exercise.duration) {
    // For time-based exercises, estimate 5-10 calories per minute
    calories = Math.round((exercise.duration / 60) * 7.5)
  } else if (exercise.sets && exercise.reps) {
    // For strength exercises, estimate based on sets and reps
    const totalReps = exercise.sets * exercise.reps
    calories = Math.round(totalReps * 0.5) // Rough estimate
  }
  
  return Math.max(calories, 0)
}