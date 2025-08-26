import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Exercise creation schema
const createExerciseSchema = z.object({
  name: z.string().min(1, "Exercise name is required").max(100, "Name must be less than 100 characters"),
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
  params: Promise<{ workoutId: string }>
}

// GET /api/user/workouts/[workoutId]/exercises - Get exercises for a workout
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { workoutId } = await params;
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user to verify ownership
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify workout ownership
    const workout = await prisma.workout.findFirst({
      where: {
        id: workoutId,
        userId: user.id
      }
    })

    if (!workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 })
    }

    // Get exercises for the workout
    const exercises = await prisma.exercise.findMany({
      where: { workoutId },
      orderBy: { order: "asc" }
    })

    return NextResponse.json({
      success: true,
      exercises
    })

  } catch (error) {
    console.error("Error fetching exercises:", error)
    return NextResponse.json(
      { error: "Failed to fetch exercises" },
      { status: 500 }
    )
  }
}

// POST /api/user/workouts/[workoutId]/exercises - Add exercise to workout
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const { workoutId } = await params;
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createExerciseSchema.parse(body)

    // Get user to verify ownership
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify workout ownership
    const workout = await prisma.workout.findFirst({
      where: {
        id: workoutId,
        userId: user.id
      }
    })

    if (!workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 })
    }

    // Get next order number if not provided
    let { order } = validatedData
    if (!order) {
      const lastExercise = await prisma.exercise.findFirst({
        where: { workoutId },
        orderBy: { order: "desc" }
      })
      order = (lastExercise?.order || 0) + 1
    }

    // Create exercise
    const exercise = await prisma.exercise.create({
      data: {
        workoutId,
        name: validatedData.name,
        sets: validatedData.sets,
        reps: validatedData.reps,
        weight: validatedData.weight,
        duration: validatedData.duration,
        distance: validatedData.distance,
        restTime: validatedData.restTime,
        notes: validatedData.notes,
        order
      }
    })

    return NextResponse.json({
      success: true,
      exercise
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }
    
    console.error("Error creating exercise:", error)
    return NextResponse.json(
      { error: "Failed to create exercise" },
      { status: 500 }
    )
  }
}

// PUT /api/user/workouts/[workoutId]/exercises - Reorder exercises
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const { workoutId } = await params;
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { exerciseOrders } = body // Array of { id, order }

    if (!Array.isArray(exerciseOrders)) {
      return NextResponse.json(
        { error: "exerciseOrders must be an array" },
        { status: 400 }
      )
    }

    // Get user to verify ownership
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify workout ownership
    const workout = await prisma.workout.findFirst({
      where: {
        id: workoutId,
        userId: user.id
      }
    })

    if (!workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 })
    }

    // Update exercise orders
    await Promise.all(
      exerciseOrders.map(({ id: exerciseId, order }) =>
        prisma.exercise.update({
          where: {
            id: exerciseId,
            workoutId
          },
          data: { order }
        })
      )
    )

    // Get updated exercises
    const updatedExercises = await prisma.exercise.findMany({
      where: { workoutId },
      orderBy: { order: "asc" }
    })

    return NextResponse.json({
      success: true,
      exercises: updatedExercises
    })

  } catch (error) {
    console.error("Error reordering exercises:", error)
    return NextResponse.json(
      { error: "Failed to reorder exercises" },
      { status: 500 }
    )
  }
}