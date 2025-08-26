import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Profile update schema
const profileUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  height: z.number().positive().optional(),
  activityLevel: z.enum(["SEDENTARY", "LIGHTLY_ACTIVE", "MODERATELY_ACTIVE", "VERY_ACTIVE", "EXTREMELY_ACTIVE"]).optional(),
  fitnessGoals: z.array(z.string()).optional(),
  medicalConditions: z.array(z.string()).optional(),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string()
  }).optional()
})

// GET /api/user/profile - Get user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profile: user.profile
      }
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = profileUpdateSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update or create profile
    const updatedProfile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        age: validatedData.dateOfBirth ? new Date().getFullYear() - new Date(validatedData.dateOfBirth).getFullYear() : undefined,
        gender: validatedData.gender,
        height: validatedData.height,
        activityLevel: validatedData.activityLevel,
        fitnessGoals: validatedData.fitnessGoals?.join(', '),
        medicalHistory: validatedData.medicalConditions?.join(', '),
        emergencyContact: validatedData.emergencyContact ? JSON.stringify(validatedData.emergencyContact) : undefined,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        age: validatedData.dateOfBirth ? new Date().getFullYear() - new Date(validatedData.dateOfBirth).getFullYear() : undefined,
        gender: validatedData.gender,
        height: validatedData.height,
        activityLevel: validatedData.activityLevel,
        fitnessGoals: validatedData.fitnessGoals?.join(', ') || '',
        medicalHistory: validatedData.medicalConditions?.join(', '),
        emergencyContact: validatedData.emergencyContact ? JSON.stringify(validatedData.emergencyContact) : undefined
      }
    })

    // Update user fields if provided
    if (validatedData.firstName || validatedData.lastName) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName
        }
      })
    }

    return NextResponse.json({ profile: updatedProfile })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}