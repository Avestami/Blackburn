import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Goal update schema
const updateGoalSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters").optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  targetValue: z.number().positive("Target value must be positive").optional(),
  currentValue: z.number().min(0, "Current value cannot be negative").optional(),
  unit: z.string().max(20, "Unit must be less than 20 characters").optional(),
  targetDate: z.string().datetime().optional(),
  isActive: z.boolean().optional()
})

// Progress update schema (removed as it's not used in this file)

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// Calculate goal progress
function calculateProgress(currentValue: number | null, targetValue: number | null): number | null {
  if (currentValue === null || targetValue === null || targetValue === 0) {
    return null
  }
  return Math.min(Math.round((currentValue / targetValue) * 100), 100)
}

// Get goal status
function getGoalStatus(progress: number | null, targetDate: Date | null): string {
  if (progress === null) return "not_started"
  if (progress >= 100) return "completed"
  
  if (targetDate) {
    const now = new Date()
    if (now > targetDate) return "overdue"
    
    const daysLeft = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysLeft <= 7 && progress < 80) return "at_risk"
  }
  
  return "in_progress"
}

// GET /api/user/goals/[id] - Get specific goal
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params
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

    const goal = await prisma.fitnessGoal.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    const progress = calculateProgress(goal.currentValue, goal.targetValue)
    const status = getGoalStatus(progress, goal.targetDate)
    
    let daysLeft = null
    if (goal.targetDate) {
      const now = new Date()
      daysLeft = Math.ceil((goal.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }

    return NextResponse.json({
      goal: {
        ...goal,
        progress,
        status,
        daysLeft
      }
    })
  } catch (error) {
    console.error("Goal fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/user/goals/[id] - Update goal
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateGoalSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if the goal exists and belongs to the user
    const existingGoal = await prisma.fitnessGoal.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!existingGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    // Update the goal
    const updatedGoal = await prisma.fitnessGoal.update({
      where: { id: id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.targetValue && { targetValue: validatedData.targetValue }),
        ...(validatedData.currentValue !== undefined && { currentValue: validatedData.currentValue }),
        ...(validatedData.unit !== undefined && { unit: validatedData.unit }),
        ...(validatedData.targetDate && { targetDate: new Date(validatedData.targetDate) }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive })
      }
    })

    const progress = calculateProgress(updatedGoal.currentValue, updatedGoal.targetValue)
    const status = getGoalStatus(progress, updatedGoal.targetDate)
    
    let daysLeft = null
    if (updatedGoal.targetDate) {
      const now = new Date()
      daysLeft = Math.ceil((updatedGoal.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }

    return NextResponse.json({
      message: "Goal updated successfully",
      goal: {
        ...updatedGoal,
        progress,
        status,
        daysLeft
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    console.error("Goal update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/user/goals/[id] - Delete goal
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params
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

    // Check if the goal exists and belongs to the user
    const existingGoal = await prisma.fitnessGoal.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!existingGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    // Delete the goal
    await prisma.fitnessGoal.delete({
      where: { id: id }
    })

    return NextResponse.json({
      message: "Goal deleted successfully"
    })
  } catch (error) {
    console.error("Goal deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}