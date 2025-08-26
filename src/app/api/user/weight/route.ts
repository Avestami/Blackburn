import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Weight entry schema
const weightEntrySchema = z.object({
  weight: z.number().positive("Weight must be positive"),
  notes: z.string().optional()
})

// Calculate BMI
function calculateBMI(weight: number, height: number): number {
  // height in cm, weight in kg
  const heightInMeters = height / 100
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1))
}

// Get BMI category
function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight"
  if (bmi < 25) return "Normal weight"
  if (bmi < 30) return "Overweight"
  return "Obese"
}

// GET /api/user/weight - Get weight history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "30")
    const offset = parseInt(searchParams.get("offset") || "0")

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const weightEntries = await prisma.weight.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset
    })

    // Calculate BMI for each entry if height is available
    const entriesWithBMI = weightEntries.map((entry: any) => {
      let bmi = null
      let bmiCategory = null
      
      if (user.profile?.height) {
        bmi = calculateBMI(entry.weight, user.profile.height)
        bmiCategory = getBMICategory(bmi)
      }
      
      return {
        ...entry,
        bmi,
        bmiCategory
      }
    })

    // Get total count for pagination
    const totalCount = await prisma.weight.count({
      where: { userId: user.id }
    })

    return NextResponse.json({
      entries: entriesWithBMI,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error) {
    console.error("Weight entries fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/user/weight - Add new weight entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = weightEntrySchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const weightEntry = await prisma.weight.create({
      data: {
        userId: user.id,
        weight: validatedData.weight,
        notes: validatedData.notes
      }
    })

    // Calculate BMI if height is available
    let bmi = null
    let bmiCategory = null
    
    if (user.profile?.height) {
      bmi = calculateBMI(weightEntry.weight, user.profile.height)
      bmiCategory = getBMICategory(bmi)
    }

    return NextResponse.json({
      entry: {
        ...weightEntry,
        bmi,
        bmiCategory
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    console.error("Weight entry creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}