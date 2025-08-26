import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Workout update schema
const updateWorkoutSchema = z.object({
  name: z.string().min(1, "Workout name is required").max(100, "Name must be less than 100 characters").optional(),
  type: z.enum(["strength", "cardio", "flexibility", "sports", "other"]).optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute").max(600, "Duration cannot exceed 10 hours").optional(),
  caloriesBurned: z.number().min(0, "Calories burned cannot be negative").optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional()
})

interface RouteParams {
  params: Promise<{ workoutId: string }>
}

// GET /api/user/workouts/[workoutId] - Get specific workout
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { workoutId } = await params;
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user to verify ownership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get workout with exercises
    const workout = await prisma.workout.findFirst({
      where: {
        id: workoutId,
        userId: user.id
      },
      include: {
        exercises: {
          orderBy: { order: "asc" }
        }
      }
    })

    if (!workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      workout
    })

  } catch (error) {
    console.error("Error fetching workout:", error)
    return NextResponse.json(
      { error: "Failed to fetch workout" },
      { status: 500 }
    )
  }
}

// PUT /api/user/workouts/[workoutId] - Update workout
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const { workoutId } = await params;
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateWorkoutSchema.parse(body)

    // Get user to verify ownership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if workout exists and belongs to user
    const existingWorkout = await prisma.workout.findFirst({
      where: {
        id: workoutId,
        userId: user.id
      }
    })

    if (!existingWorkout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 })
    }

    // Update workout
    const updatedWorkout = await prisma.workout.update({
      where: { id: workoutId },
      data: validatedData,
      include: {
        exercises: {
          orderBy: { order: "asc" }
        }
      }
    })

    return NextResponse.json({
      success: true,
      workout: updatedWorkout
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }
    
    console.error("Error updating workout:", error)
    return NextResponse.json(
      { error: "Failed to update workout" },
      { status: 500 }
    )
  }
}

// DELETE /api/user/workouts/[workoutId] - Delete workout
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const { workoutId } = await params;
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user to verify ownership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if workout exists and belongs to user
    const existingWorkout = await prisma.workout.findFirst({
      where: {
        id: workoutId,
        userId: user.id
      }
    })

    if (!existingWorkout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 })
    }

    // Delete workout (exercises will be deleted due to cascade)
    await prisma.workout.delete({
      where: { id: workoutId }
    })

    return NextResponse.json({
      success: true,
      message: "Workout deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting workout:", error)
    return NextResponse.json(
      { error: "Failed to delete workout" },
      { status: 500 }
    )
  }
}