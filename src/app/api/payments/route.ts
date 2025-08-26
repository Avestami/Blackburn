import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PaymentStatus } from '@prisma/client'
import { z } from 'zod'

const createPaymentSchema = z.object({
  programId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  receiptUrl: z.string().url().optional(),
  notes: z.string().optional()
})



// GET /api/payments - Get user's payment history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    const whereClause: {
      userId: string
      status?: PaymentStatus
    } = { userId: session.user.id }
    
    if (status) {
      whereClause.status = status as PaymentStatus
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: whereClause,
        include: {
          program: {
            select: {
              id: true,
              name: true,
              price: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.payment.count({ where: whereClause })
    ])

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/payments - Create a new payment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createPaymentSchema.parse(body)

    // Check if program exists and is active
    const program = await prisma.program.findFirst({
      where: {
        id: validatedData.programId,
        isActive: true
      }
    })

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found or inactive' },
        { status: 404 }
      )
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        programId: validatedData.programId,
        amount: validatedData.amount,
        currency: validatedData.currency,
        receiptUrl: validatedData.receiptUrl,
        adminNotes: validatedData.notes,
        status: 'PENDING'
      },
      include: {
        program: {
          select: {
            id: true,
            name: true,
            price: true
          }
        }
      }
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}