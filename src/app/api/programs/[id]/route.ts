import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/programs/[id] - Get specific program details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const program = await prisma.program.findUnique({
      where: { id }
    })

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 })
    }

    if (!program.isActive) {
      return NextResponse.json({ error: "Program is not available" }, { status: 404 })
    }

    return NextResponse.json({
      program
    })
  } catch (error) {
    console.error("Program fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/programs/[id] - Update program (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { isActive, name, description, price, duration } = body

    // Check if program exists
    const existingProgram = await prisma.program.findUnique({
      where: { id }
    })

    if (!existingProgram) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Update program
    const updatedProgram = await prisma.program.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(name && { name }),
        ...(description && { description }),
        ...(price !== undefined && { price }),
        ...(duration !== undefined && { duration })
      }
    })

    return NextResponse.json({ program: updatedProgram })

  } catch (error) {
    console.error('Program update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}