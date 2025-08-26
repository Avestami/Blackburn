import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Fitness goal schema
const fitnessGoalSchema = z.object({
  category: z.enum(["WEIGHT_LOSS", "WEIGHT_GAIN", "MUSCLE_GAIN", "ENDURANCE", "STRENGTH", "MAINTENANCE", "CUSTOM"]),
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  targetValue: z.number().positive("Target value must be positive").optional(),
  currentValue: z.number().min(0, "Current value cannot be negative").optional(),
  unit: z.string().max(20, "Unit must be less than 20 characters").optional(),
  targetDate: z.string().datetime().optional(),
  status: z.string().default("active")
})



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

// GET /api/user/goals - Get user's fitness goals
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const isActive = searchParams.get("isActive")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const whereClause: {
      userId: string
      type?: string
      isActive?: boolean
    } = { userId: user.id }

    if (type) whereClause.type = type
    if (isActive !== null) whereClause.isActive = isActive === "true"

    const goals = await prisma.fitnessGoal.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset
    })

    const totalCount = await prisma.fitnessGoal.count({
      where: whereClause
    })

    // Calculate progress and status for each goal
    const goalsWithProgress = goals.map((goal: any) => {
      const progress = calculateProgress(goal.currentValue, goal.targetValue)
      const status = getGoalStatus(progress, goal.targetDate)
      
      let daysLeft = null
      if (goal.targetDate) {
        const now = new Date()
        daysLeft = Math.ceil((goal.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      }
      
      return {
        ...goal,
        progress,
        status,
        daysLeft
      }
    })

    // Calculate summary statistics
    const activeGoals = goalsWithProgress.filter((goal: any) => goal.status === "active")
    const completedGoals = activeGoals.filter((goal: any) => goal.status === "completed")
    const inProgressGoals = activeGoals.filter((goal: any) => goal.status === "in_progress")
    const atRiskGoals = activeGoals.filter((goal: any) => goal.status === "at_risk")
    const overdueGoals = activeGoals.filter((goal: any) => goal.status === "overdue")

    return NextResponse.json({
      goals: goalsWithProgress,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      summary: {
        totalActive: activeGoals.length,
        completed: completedGoals.length,
        inProgress: inProgressGoals.length,
        atRisk: atRiskGoals.length,
        overdue: overdueGoals.length,
        completionRate: activeGoals.length > 0 ? Math.round((completedGoals.length / activeGoals.length) * 100) : 0
      }
    })
  } catch (error) {
    console.error("Goals fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/user/goals - Create new fitness goal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = fitnessGoalSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user already has an active goal of the same type
    if (validatedData.category !== "CUSTOM") {
      const existingGoal = await prisma.fitnessGoal.findFirst({
        where: {
          userId: user.id,
          category: validatedData.category,
          status: "active"
        }
      })

      if (existingGoal) {
        return NextResponse.json({ 
          error: `You already have an active ${validatedData.category.toLowerCase().replace('_', ' ')} goal. Please complete or deactivate it first.` 
        }, { status: 400 })
      }
    }

    const goal = await prisma.fitnessGoal.create({
      data: {
        userId: user.id,
        category: validatedData.category,
        title: validatedData.title,
        description: validatedData.description,
        targetValue: validatedData.targetValue,
        currentValue: validatedData.currentValue || 0,
        unit: validatedData.unit,
        targetDate: validatedData.targetDate ? new Date(validatedData.targetDate) : null,
        status: validatedData.status
      }
    })

    const progress = calculateProgress(goal.currentValue, goal.targetValue)
    const status = getGoalStatus(progress, goal.targetDate)
    
    let daysLeft = null
    if (goal.targetDate) {
      const now = new Date()
      daysLeft = Math.ceil((goal.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }

    return NextResponse.json({
      message: "Fitness goal created successfully",
      goal: {
        ...goal,
        progress,
        status,
        daysLeft
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    console.error("Goal creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}