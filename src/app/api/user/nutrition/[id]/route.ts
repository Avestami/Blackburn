import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Nutrition entry update schema
const updateNutritionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  foodName: z.string().min(1, "Food name is required").max(100, "Food name must be less than 100 characters").optional(),
  quantity: z.number().min(0.1, "Quantity must be at least 0.1").optional(),
  unit: z.string().min(1, "Unit is required").max(20, "Unit must be less than 20 characters").optional(),
  calories: z.number().min(0, "Calories cannot be negative").optional(),
  protein: z.number().min(0, "Protein cannot be negative").optional(),
  carbs: z.number().min(0, "Carbs cannot be negative").optional(),
  fat: z.number().min(0, "Fat cannot be negative").optional(),
  fiber: z.number().min(0, "Fiber cannot be negative").optional(),
  sugar: z.number().min(0, "Sugar cannot be negative").optional(),
  sodium: z.number().min(0, "Sodium cannot be negative").optional(),
  notes: z.string().max(200, "Notes must be less than 200 characters").optional()
})

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/user/nutrition/[id] - Get specific nutrition entry
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
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

    const nutritionEntry = await prisma.nutritionEntry.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!nutritionEntry) {
      return NextResponse.json({ error: "Nutrition entry not found" }, { status: 404 })
    }

    // Calculate nutritional ratios
    const totalMacros = (nutritionEntry.protein || 0) + (nutritionEntry.carbs || 0) + (nutritionEntry.fat || 0)
    const macroRatios = totalMacros > 0 ? {
      proteinRatio: Math.round(((nutritionEntry.protein || 0) / totalMacros) * 100),
      carbsRatio: Math.round(((nutritionEntry.carbs || 0) / totalMacros) * 100),
      fatRatio: Math.round(((nutritionEntry.fat || 0) / totalMacros) * 100)
    } : null

    // Calculate calories from macros for verification
    const calculatedCalories = {
      fromProtein: (nutritionEntry.protein || 0) * 4,
      fromCarbs: (nutritionEntry.carbs || 0) * 4,
      fromFat: (nutritionEntry.fat || 0) * 9,
      total: ((nutritionEntry.protein || 0) * 4) + ((nutritionEntry.carbs || 0) * 4) + ((nutritionEntry.fat || 0) * 9)
    }

    return NextResponse.json({
      nutritionEntry: {
        ...nutritionEntry,
        macroRatios,
        calculatedCalories
      }
    })
  } catch (error) {
    console.error("Nutrition entry fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/user/nutrition/[id] - Update nutrition entry
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateNutritionSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if nutrition entry exists and belongs to user
    const existingEntry = await prisma.nutritionEntry.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!existingEntry) {
      return NextResponse.json({ error: "Nutrition entry not found" }, { status: 404 })
    }

    // Prepare update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      ...validatedData,
      updatedAt: new Date()
    }

    // Convert date string to Date object if provided
    if (validatedData.date) {
      updateData.date = new Date(validatedData.date)
    }

    // Update the nutrition entry
    const updatedEntry = await prisma.nutritionEntry.update({
      where: { id },
      data: updateData
    })

    // Calculate updated daily totals for the affected date(s)
    const affectedDates = [existingEntry.date]
    if (validatedData.date && validatedData.date !== existingEntry.date.toISOString().split('T')[0]) {
      affectedDates.push(new Date(validatedData.date))
    }

    const dailyTotals = await Promise.all(
      affectedDates.map(async (date) => {
        const dayEntries = await prisma.nutritionEntry.findMany({
          where: {
            userId: user.id,
            date: date
          }
        })

        return {
          date: date.toISOString().split('T')[0],
          totalCalories: dayEntries.reduce((sum: number, entry: any) => sum + entry.calories, 0),
          totalProtein: dayEntries.reduce((sum: number, entry: any) => sum + (entry.protein || 0), 0),
          totalCarbs: dayEntries.reduce((sum: number, entry: any) => sum + (entry.carbs || 0), 0),
          totalFat: dayEntries.reduce((sum: number, entry: any) => sum + (entry.fat || 0), 0)
        }
      })
    )

    return NextResponse.json({
      message: "Nutrition entry updated successfully",
      nutritionEntry: updatedEntry,
      dailyTotals
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    console.error("Nutrition entry update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/user/nutrition/[id] - Delete nutrition entry
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
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

    // Check if nutrition entry exists and belongs to user
    const existingEntry = await prisma.nutritionEntry.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!existingEntry) {
      return NextResponse.json({ error: "Nutrition entry not found" }, { status: 404 })
    }

    const entryDate = existingEntry.date

    // Delete the nutrition entry
    await prisma.nutritionEntry.delete({
      where: { id }
    })

    // Calculate updated daily totals for the affected date
    const dayEntries = await prisma.nutritionEntry.findMany({
      where: {
        userId: user.id,
        date: entryDate
      }
    })

    const dailyTotals = {
      date: entryDate.toISOString().split('T')[0],
      totalCalories: dayEntries.reduce((sum: number, entry: any) => sum + entry.calories, 0),
      totalProtein: dayEntries.reduce((sum: number, entry: any) => sum + (entry.protein || 0), 0),
      totalCarbs: dayEntries.reduce((sum: number, entry: any) => sum + (entry.carbs || 0), 0),
      totalFat: dayEntries.reduce((sum: number, entry: any) => sum + (entry.fat || 0), 0)
    }

    return NextResponse.json({
      message: "Nutrition entry deleted successfully",
      dailyTotals
    })
  } catch (error) {
    console.error("Nutrition entry deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}