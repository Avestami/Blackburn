import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Onboarding completion schema
const onboardingSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone number is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  height: z.number().positive("Height must be positive"),
  weight: z.number().positive("Weight must be positive"),
  activityLevel: z.enum(["SEDENTARY", "LIGHTLY_ACTIVE", "MODERATELY_ACTIVE", "VERY_ACTIVE", "EXTREMELY_ACTIVE"]),
  fitnessGoals: z.array(z.string()).min(1, "At least one fitness goal is required"),
  medicalConditions: z.array(z.string()).optional().default([]),
  emergencyContact: z.object({
    name: z.string().min(1, "Emergency contact name is required"),
    phone: z.string().min(1, "Emergency contact phone is required"),
    relationship: z.string().min(1, "Emergency contact relationship is required")
  }),
  agreedToTerms: z.boolean().refine(val => val === true, "You must agree to terms and conditions")
})

// GET /api/user/onboarding - Check onboarding status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true,
        weights: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isOnboardingComplete = user.profile &&
      user.profile.age &&
      user.profile.gender &&
      user.profile.height &&
      user.profile.activityLevel &&
      user.profile.fitnessGoals &&
      user.profile.fitnessGoals.length > 0

    return NextResponse.json({
      isComplete: !!isOnboardingComplete,
      profile: user.profile,
      hasWeightEntry: user.weights.length > 0
    })
  } catch (error) {
    console.error("Onboarding status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/user/onboarding - Complete onboarding
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = onboardingSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx: any) => {
      // Create or update profile
      const profile = await tx.profile.upsert({
        where: { userId: user.id },
        update: {
          age: new Date().getFullYear() - new Date(validatedData.dateOfBirth).getFullYear(),
          gender: validatedData.gender,
          height: validatedData.height,
          activityLevel: validatedData.activityLevel,
          fitnessGoals: validatedData.fitnessGoals.join(', '),
          medicalHistory: validatedData.medicalConditions.join(', '),
          emergencyContact: JSON.stringify(validatedData.emergencyContact),
          isOnboarded: true,
          updatedAt: new Date()
        },
        create: {
          userId: user.id,
          age: new Date().getFullYear() - new Date(validatedData.dateOfBirth).getFullYear(),
          gender: validatedData.gender,
          height: validatedData.height,
          activityLevel: validatedData.activityLevel,
          fitnessGoals: validatedData.fitnessGoals.join(', '),
          medicalHistory: validatedData.medicalConditions.join(', '),
          emergencyContact: JSON.stringify(validatedData.emergencyContact),
          isOnboarded: true
        }
      })

      // Create initial weight entry
      const weightEntry = await tx.weight.create({
        data: {
          userId: user.id,
          weight: validatedData.weight
        }
      })

      // Update user firstName and lastName if not set
      if (!user.firstName || !user.lastName) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName
          }
        })
      }

      return { profile, weightEntry }
    })

    return NextResponse.json({
      message: "Onboarding completed successfully",
      profile: result.profile,
      weightEntry: result.weightEntry
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    console.error("Onboarding completion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}