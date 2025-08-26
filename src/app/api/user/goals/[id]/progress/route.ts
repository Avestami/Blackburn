import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Progress update schema
const progressUpdateSchema = z.object({
  currentValue: z.number().min(0, "Current value cannot be negative"),
  notes: z.string().max(200, "Notes must be less than 200 characters").optional()
})

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

// POST /api/user/goals/[id]/progress - Update goal progress
export async function POST(
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
    const validatedData = progressUpdateSchema.parse(body)

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

    if (existingGoal.status !== "active") {
      return NextResponse.json({ error: "Cannot update progress for inactive goal" }, { status: 400 })
    }

    // Update the goal's current value
    const updatedGoal = await prisma.fitnessGoal.update({
      where: { id: id },
      data: {
        currentValue: validatedData.currentValue,
        updatedAt: new Date()
      }
    })

    // Create a progress entry for tracking history
    const progressEntry = await prisma.goalProgress.create({
      data: {
        goalId: id,
        userId: user.id,
        value: validatedData.currentValue,
        notes: validatedData.notes
      }
    })

    const progress = calculateProgress(updatedGoal.currentValue, updatedGoal.targetValue)
    const status = getGoalStatus(progress, updatedGoal.targetDate)
    
    let daysLeft = null
    if (updatedGoal.targetDate) {
      const now = new Date()
      daysLeft = Math.ceil((updatedGoal.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Check if goal is completed and update status
    let message = "Progress updated successfully"
    if (progress && progress >= 100) {
      message = "Congratulations! You've completed your goal!"
    }

    return NextResponse.json({
      message,
      goal: {
        ...updatedGoal,
        progress,
        status,
        daysLeft
      },
      progressEntry
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    console.error("Progress update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/user/goals/[id]/progress - Get goal progress history
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "30")
    const offset = parseInt(searchParams.get("offset") || "0")

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if the goal exists and belongs to the user
    const goal = await prisma.fitnessGoal.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    // Get progress history
    const progressHistory = await prisma.goalProgress.findMany({
      where: { goalId: id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset
    })

    const totalCount = await prisma.goalProgress.count({
      where: { goalId: id }
    })

    // Calculate progress percentage for each entry
    const progressWithPercentage = progressHistory.map((entry: any) => {
      const progressPercentage = calculateProgress(entry.value, goal.targetValue)
      return {
        ...entry,
        progressPercentage
      }
    })

    // Calculate progress trend
    let progressTrend = null
    let progressChange = null
    
    if (progressHistory.length >= 2) {
      const latestProgress = progressHistory[0].value
      const previousProgress = progressHistory[1].value
      progressChange = Number((latestProgress - previousProgress).toFixed(2))
      
      if (progressChange > 0) progressTrend = "improving"
      else if (progressChange < 0) progressTrend = "declining"
      else progressTrend = "stable"
    }

    const currentProgress = calculateProgress(goal.currentValue, goal.targetValue)
    const status = getGoalStatus(currentProgress, goal.targetDate)

    return NextResponse.json({
      goal: {
        id: goal.id,
        title: goal.title,
        category: goal.category,
        targetValue: goal.targetValue,
        currentValue: goal.currentValue,
        unit: goal.unit,
        targetDate: goal.targetDate,
        progress: currentProgress,
        status
      },
      progressHistory: progressWithPercentage,
      progressTrend,
      progressChange,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error) {
    console.error("Progress history fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}