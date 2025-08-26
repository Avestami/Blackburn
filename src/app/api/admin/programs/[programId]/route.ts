import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProgramSchema = z.object({
  name: z.string().min(1, 'Program name is required').optional(),
  description: z.string().min(1, 'Program description is required').optional(),
  price: z.number().min(0, 'Price must be positive').optional(),
  duration: z.number().min(1, 'Duration must be at least 1 day').optional(),
  isActive: z.boolean().optional(),
  originalPrice: z.number().optional(), // For discount tracking
  discountPercentage: z.number().min(0).max(100).optional(), // Discount percentage (0-100)
  discountedPrice: z.number().min(0).optional() // Calculated discounted price
})

// PUT /api/admin/programs/[programId] - Update program
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { programId } = await params
    const body = await request.json()
    const validatedData = updateProgramSchema.parse(body)

    // Check if program exists
    const existingProgram = await prisma.program.findUnique({
      where: { id: programId }
    })

    if (!existingProgram) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // If updating name, check for duplicates
    if (validatedData.name && validatedData.name !== existingProgram.name) {
      const duplicateProgram = await prisma.program.findFirst({
        where: {
          name: validatedData.name,
          id: {
            not: programId
          }
        }
      })

      if (duplicateProgram) {
        return NextResponse.json(
          { error: 'Program with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Handle discount logic
    let updateData: any = {
      ...(validatedData.name && { name: validatedData.name }),
      ...(validatedData.description && { description: validatedData.description }),
      ...(validatedData.duration && { duration: validatedData.duration }),
      ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive })
    }

    // Handle discount application
    if (validatedData.discountedPrice !== undefined && validatedData.discountPercentage !== undefined) {
      // Apply discount
      updateData.originalPrice = existingProgram.originalPrice || existingProgram.price
      updateData.price = validatedData.discountedPrice
      updateData.discountPercentage = validatedData.discountPercentage
    } else if (validatedData.price !== undefined) {
      // Regular price update (remove discount if exists)
      updateData.price = validatedData.price
      updateData.originalPrice = null
      updateData.discountPercentage = null
    }

    // Update program
    const updatedProgram = await prisma.program.update({
      where: { id: programId },
      data: updateData
    })

    return NextResponse.json(updatedProgram)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Program update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/programs/[programId] - Delete program
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { programId } = await params

    // Check if program exists
    const existingProgram = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        _count: {
          select: {
            payments: true
          }
        }
      }
    })

    if (!existingProgram) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Check if program has active subscriptions/payments
    if (existingProgram._count.payments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete program with existing payments/subscriptions' },
        { status: 400 }
      )
    }

    // Delete the program
    await prisma.program.delete({
      where: { id: programId }
    })

    return NextResponse.json({ message: 'Program deleted successfully' })
  } catch (error) {
    console.error('Program deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/admin/programs/[programId] - Get specific program details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { programId } = await params

    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        _count: {
          select: {
            payments: {
              where: { status: 'APPROVED' }
            }
          }
        }
      }
    })

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    return NextResponse.json(program)
  } catch (error) {
    console.error('Program fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}