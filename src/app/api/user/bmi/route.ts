import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// BMI calculation schema
const bmiCalculationSchema = z.object({
  weight: z.number().min(20, "Weight must be at least 20 kg").max(500, "Weight must be less than 500 kg"),
  height: z.number().min(100, "Height must be at least 100 cm").max(250, "Height must be less than 250 cm")
})

// Calculate BMI
function calculateBMI(weight: number, height: number): number {
  const heightInMeters = height / 100
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1))
}

// Get BMI category and recommendations
function getBMIInfo(bmi: number) {
  let category: string
  let healthStatus: string
  let recommendations: string[]
  let colorCode: string

  if (bmi < 18.5) {
    category = "Underweight"
    healthStatus = "Below normal weight"
    colorCode = "#3B82F6" // Blue
    recommendations = [
      "Consider consulting with a healthcare provider",
      "Focus on nutrient-dense, calorie-rich foods",
      "Include strength training to build muscle mass",
      "Ensure adequate protein intake"
    ]
  } else if (bmi < 25) {
    category = "Normal weight"
    healthStatus = "Healthy weight range"
    colorCode = "#10B981" // Green
    recommendations = [
      "Maintain current healthy lifestyle",
      "Continue regular physical activity",
      "Keep a balanced, nutritious diet",
      "Monitor weight regularly"
    ]
  } else if (bmi < 30) {
    category = "Overweight"
    healthStatus = "Above normal weight"
    colorCode = "#F59E0B" // Yellow/Orange
    recommendations = [
      "Consider gradual weight loss (1-2 lbs per week)",
      "Increase physical activity to 150+ minutes per week",
      "Focus on portion control and balanced meals",
      "Consider consulting with a nutritionist"
    ]
  } else {
    category = "Obese"
    healthStatus = "Significantly above normal weight"
    colorCode = "#EF4444" // Red
    recommendations = [
      "Consult with healthcare provider for weight management plan",
      "Consider supervised weight loss program",
      "Focus on sustainable lifestyle changes",
      "Regular monitoring of health markers"
    ]
  }

  return {
    category,
    healthStatus,
    recommendations,
    colorCode
  }
}

// Calculate ideal weight range
function getIdealWeightRange(height: number) {
  const heightInMeters = height / 100
  const minIdealWeight = 18.5 * heightInMeters * heightInMeters
  const maxIdealWeight = 24.9 * heightInMeters * heightInMeters
  
  return {
    min: Math.round(minIdealWeight * 10) / 10,
    max: Math.round(maxIdealWeight * 10) / 10
  }
}

// POST /api/user/bmi - Calculate BMI
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = bmiCalculationSchema.parse(body)

    const { weight, height } = validatedData
    const bmi = calculateBMI(weight, height)
    const bmiInfo = getBMIInfo(bmi)
    const idealWeightRange = getIdealWeightRange(height)

    // Calculate weight difference from ideal range
    let weightDifference = null
    let weightGoal = null
    
    if (weight < idealWeightRange.min) {
      weightDifference = weight - idealWeightRange.min
      weightGoal = `Gain ${Math.abs(weightDifference).toFixed(1)} kg to reach healthy weight`
    } else if (weight > idealWeightRange.max) {
      weightDifference = weight - idealWeightRange.max
      weightGoal = `Lose ${weightDifference.toFixed(1)} kg to reach healthy weight`
    } else {
      weightGoal = "You are in the healthy weight range"
    }

    return NextResponse.json({
      bmi,
      category: bmiInfo.category,
      healthStatus: bmiInfo.healthStatus,
      colorCode: bmiInfo.colorCode,
      recommendations: bmiInfo.recommendations,
      idealWeightRange,
      weightGoal,
      weightDifference,
      inputs: {
        weight,
        height
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    console.error("BMI calculation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/user/bmi - Get BMI history and trends
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

    if (!user.profile?.height) {
      return NextResponse.json({ 
        error: "Height not set in profile. Please update your profile with height information." 
      }, { status: 400 })
    }

    const weightEntries = await prisma.weight.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset
    })

    // Calculate BMI for each entry
    const bmiHistory = weightEntries.map((entry: any) => {
      const bmi = calculateBMI(entry.weight, user.profile!.height!)
      const bmiInfo = getBMIInfo(bmi)
      
      return {
        id: entry.id,
        date: entry.createdAt,
        weight: entry.weight,
        bmi,
        category: bmiInfo.category,
        colorCode: bmiInfo.colorCode,
        notes: entry.notes
      }
    })

    // Calculate BMI trend
    let bmiTrend = null
    let bmiChange = null
    
    if (bmiHistory.length >= 2) {
      const latestBMI = bmiHistory[0].bmi
      const previousBMI = bmiHistory[1].bmi
      bmiChange = Number((latestBMI - previousBMI).toFixed(1))
      
      if (bmiChange > 0.5) bmiTrend = "increasing"
      else if (bmiChange < -0.5) bmiTrend = "decreasing"
      else bmiTrend = "stable"
    }

    const currentBMI = bmiHistory[0]?.bmi
    const currentBMIInfo = currentBMI ? getBMIInfo(currentBMI) : null
    const idealWeightRange = getIdealWeightRange(user.profile.height)

    return NextResponse.json({
      currentBMI,
      currentCategory: currentBMIInfo?.category,
      currentHealthStatus: currentBMIInfo?.healthStatus,
      bmiTrend,
      bmiChange,
      idealWeightRange,
      userHeight: user.profile.height,
      bmiHistory,
      recommendations: currentBMIInfo?.recommendations || [],
      pagination: {
        total: weightEntries.length,
        limit,
        offset,
        hasMore: offset + limit < weightEntries.length
      }
    })
  } catch (error) {
    console.error("BMI history fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}