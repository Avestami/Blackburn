import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updatePaymentSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  adminNotes: z.string().optional()
})

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/payments/[id] - Get specific payment details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payment = await prisma.payment.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        program: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            duration: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Error fetching payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/payments/[id] - Update payment status (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
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

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updatePaymentSchema.parse(body)

    // Get the payment to update
    const existingPayment = await prisma.payment.findUnique({
      where: { id },
      include: {
        program: true,
        user: true
      }
    })

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Use transaction to update payment and create subscription if approved
    const result = await prisma.$transaction(async (tx: any) => {
      // Update payment status
      const updatedPayment = await tx.payment.update({
        where: { id },
        data: {
          status: validatedData.status,
          adminNotes: validatedData.adminNotes,
          processedAt: new Date()
        },
        include: {
          program: true,
          user: true
        }
      })

      // If payment is approved, handle referral bonus
      if (validatedData.status === 'APPROVED') {
        // Handle referral bonus if user was referred
        const referral = await tx.referral.findFirst({
          where: {
            referredUserId: existingPayment.userId,
            status: 'completed'
          }
        })

        if (referral) {
          const bonusAmount = Number(existingPayment.amount) * 0.1 // 10% referral bonus
          
          // Update referrer's wallet
          await tx.wallet.upsert({
            where: { userId: referral.referrerId },
            update: {
              balance: {
                increment: bonusAmount
              }
            },
            create: {
              userId: referral.referrerId,
              balance: bonusAmount
            }
          })

          // Create wallet ledger entry
          const wallet = await tx.wallet.findUnique({
            where: { userId: referral.referrerId }
          })
          
          if (wallet) {
            await tx.walletLedger.create({
              data: {
                walletId: wallet.id,
                amount: bonusAmount,
                type: 'CREDIT',
                description: `Referral bonus for ${existingPayment.user.firstName || existingPayment.user.email}`,
                referenceId: existingPayment.id,
                referenceType: 'payment'
              }
            })
          }
        }
      }

      return updatedPayment
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/payments/[id] - Cancel payment (only if pending)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payment = await prisma.payment.findFirst({
      where: {
        id,
        userId: session.user.id,
        status: 'PENDING'
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found or cannot be cancelled' },
        { status: 404 }
      )
    }

    await prisma.payment.update({
      where: { id },
      data: { status: 'REJECTED' }
    })

    return NextResponse.json({ message: 'Payment cancelled successfully' })
  } catch (error) {
    console.error('Error cancelling payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}