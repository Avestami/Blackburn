import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateLanguageSchema = z.object({
  language: z.string().min(2).max(5), // e.g., "en", "fa", "ar", "es"
})

// GET /api/user/language - Get user's language preference
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { language: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      language: user.language
    })
  } catch (error) {
    console.error("Error fetching user language:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/user/language - Update user's language preference
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateLanguageSchema.parse(body)

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { language: validatedData.language },
      select: { language: true }
    })

    return NextResponse.json({
      message: "Language preference updated successfully",
      language: updatedUser.language
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid language format", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error updating user language:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}