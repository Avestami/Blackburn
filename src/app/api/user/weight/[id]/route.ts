import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Weight entry update schema
const weightUpdateSchema = z.object({
  weight: z.number().positive("Weight must be positive").optional(),
  notes: z.string().optional()
})

// Calculate BMI
function calculateBMI(weight: number, height: number): number {
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

// GET /api/user/weight/[id] - Get specific weight entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const weightEntry = await prisma.weight.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!weightEntry) {
      return NextResponse.json({ error: "Weight entry not found" }, { status: 404 })
    }

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
    console.error("Weight entry fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/user/weight/[id] - Update weight entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = weightUpdateSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if weight entry exists and belongs to user
    const existingEntry = await prisma.weight.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!existingEntry) {
      return NextResponse.json({ error: "Weight entry not found" }, { status: 404 })
    }

    const updatedEntry = await prisma.weight.update({
      where: { id: id },
      data: {
        ...validatedData
      }
    })

    // Calculate BMI if height is available
    let bmi = null
    let bmiCategory = null
    
    if (user.profile?.height) {
      bmi = calculateBMI(updatedEntry.weight, user.profile.height)
      bmiCategory = getBMICategory(bmi)
    }

    return NextResponse.json({
      entry: {
        ...updatedEntry,
        bmi,
        bmiCategory
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    console.error("Weight entry update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/user/weight/[id] - Delete weight entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Check if weight entry exists and belongs to user
    const existingEntry = await prisma.weight.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!existingEntry) {
      return NextResponse.json({ error: "Weight entry not found" }, { status: 404 })
    }

    await prisma.weight.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: "Weight entry deleted successfully" })
  } catch (error) {
    console.error("Weight entry deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}