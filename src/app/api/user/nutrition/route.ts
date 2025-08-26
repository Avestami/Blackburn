import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Nutrition entry creation schema
const createNutritionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  foodName: z.string().min(1, "Food name is required").max(100, "Food name must be less than 100 characters"),
  quantity: z.number().min(0.1, "Quantity must be at least 0.1"),
  unit: z.string().min(1, "Unit is required").max(20, "Unit must be less than 20 characters"),
  calories: z.number().min(0, "Calories cannot be negative"),
  protein: z.number().min(0, "Protein cannot be negative").optional(),
  carbs: z.number().min(0, "Carbs cannot be negative").optional(),
  fat: z.number().min(0, "Fat cannot be negative").optional(),
  fiber: z.number().min(0, "Fiber cannot be negative").optional(),
  sugar: z.number().min(0, "Sugar cannot be negative").optional(),
  sodium: z.number().min(0, "Sodium cannot be negative").optional(),
  notes: z.string().max(200, "Notes must be less than 200 characters").optional()
})

// GET /api/user/nutrition - Get user's nutrition history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const date = searchParams.get("date")
    const mealType = searchParams.get("mealType")
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
      date?: Date | { gte?: Date; lte?: Date }
      mealType?: string
    } = {
      userId: user.id
    }

    if (date) {
      whereClause.date = new Date(date)
    } else if (startDate || endDate) {
      whereClause.date = {}
      if (startDate) {
        whereClause.date.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate)
      }
    }

    if (mealType) {
      whereClause.mealType = mealType
    }

    // Get nutrition entries
    const nutritionEntries = await prisma.nutritionEntry.findMany({
      where: whereClause,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: limit,
      skip: offset
    })

    const totalCount = await prisma.nutritionEntry.count({
      where: whereClause
    })

    // Calculate daily totals if querying for a specific date
    let dailyTotals = null
    if (date) {
      const dayEntries = await prisma.nutritionEntry.findMany({
        where: {
          userId: user.id,
          date: new Date(date)
        }
      })

      dailyTotals = {
        totalCalories: dayEntries.reduce((sum: number, entry: any) => sum + entry.calories, 0),
        totalProtein: dayEntries.reduce((sum: number, entry: any) => sum + (entry.protein || 0), 0),
        totalCarbs: dayEntries.reduce((sum: number, entry: any) => sum + (entry.carbs || 0), 0),
        totalFat: dayEntries.reduce((sum: number, entry: any) => sum + (entry.fat || 0), 0),
        totalFiber: dayEntries.reduce((sum: number, entry: any) => sum + (entry.fiber || 0), 0),
        totalSugar: dayEntries.reduce((sum: number, entry: any) => sum + (entry.sugar || 0), 0),
        totalSodium: dayEntries.reduce((sum: number, entry: any) => sum + (entry.sodium || 0), 0),
        mealBreakdown: {
          breakfast: dayEntries.filter((e: any) => e.mealType === 'breakfast').reduce((sum: number, e: any) => sum + e.calories, 0),
          lunch: dayEntries.filter((e: any) => e.mealType === 'lunch').reduce((sum: number, e: any) => sum + e.calories, 0),
          dinner: dayEntries.filter((e: any) => e.mealType === 'dinner').reduce((sum: number, e: any) => sum + e.calories, 0),
          snack: dayEntries.filter((e: any) => e.mealType === 'snack').reduce((sum: number, e: any) => sum + e.calories, 0)
        }
      }
    }

    // Calculate weekly averages (last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const weeklyEntries = await prisma.nutritionEntry.findMany({
      where: {
        userId: user.id,
        date: {
          gte: weekAgo
        }
      }
    })

    const weeklyStats = {
      averageCalories: weeklyEntries.length > 0 ? Math.round(weeklyEntries.reduce((sum: number, entry: any) => sum + entry.calories, 0) / 7) : 0,
      averageProtein: weeklyEntries.length > 0 ? Math.round(weeklyEntries.reduce((sum: number, entry: any) => sum + (entry.protein || 0), 0) / 7) : 0,
      averageCarbs: weeklyEntries.length > 0 ? Math.round(weeklyEntries.reduce((sum: number, entry: any) => sum + (entry.carbs || 0), 0) / 7) : 0,
      averageFat: weeklyEntries.length > 0 ? Math.round(weeklyEntries.reduce((sum: number, entry: any) => sum + (entry.fat || 0), 0) / 7) : 0,
      totalEntries: weeklyEntries.length
    }

    return NextResponse.json({
      nutritionEntries,
      dailyTotals,
      weeklyStats,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error) {
    console.error("Nutrition fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/user/nutrition - Create a new nutrition entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createNutritionSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create the nutrition entry
    const nutritionEntry = await prisma.nutritionEntry.create({
      data: {
        userId: user.id,
        date: new Date(validatedData.date),
        mealType: validatedData.mealType,
        foodName: validatedData.foodName,
        quantity: validatedData.quantity,
        unit: validatedData.unit,
        calories: validatedData.calories,
        protein: validatedData.protein,
        carbs: validatedData.carbs,
        fat: validatedData.fat,
        fiber: validatedData.fiber,
        sugar: validatedData.sugar,
        sodium: validatedData.sodium,
        notes: validatedData.notes
      }
    })

    // Calculate updated daily totals
    const dayEntries = await prisma.nutritionEntry.findMany({
      where: {
        userId: user.id,
        date: new Date(validatedData.date)
      }
    })

    const dailyTotals = {
      totalCalories: dayEntries.reduce((sum: number, entry: any) => sum + entry.calories, 0),
      totalProtein: dayEntries.reduce((sum: number, entry: any) => sum + (entry.protein || 0), 0),
      totalCarbs: dayEntries.reduce((sum: number, entry: any) => sum + (entry.carbs || 0), 0),
      totalFat: dayEntries.reduce((sum: number, entry: any) => sum + (entry.fat || 0), 0)
    }

    return NextResponse.json({
      message: "Nutrition entry created successfully",
      nutritionEntry,
      dailyTotals
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    console.error("Nutrition creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}