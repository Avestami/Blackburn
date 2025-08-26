import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updatePaymentSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  adminNotes: z.string().optional(),
  amount: z.number().min(0).optional(),
  receiptUrl: z.string().url().optional()
})

// GET /api/admin/payments/[paymentId] - Get specific payment details for admin
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
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

    const { paymentId } = await params

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true,
            telegramId: true
          }
        },
        program: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            duration: true,
            category: true
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Payment fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/payments/[paymentId] - Update payment details
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
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

    const { paymentId } = await params
    const body = await request.json()
    const validatedData = updatePaymentSchema.parse(body)

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        program: true,
        user: true
      }
    })

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Use transaction to update payment and handle status changes
    const result = await prisma.$transaction(async (tx: any) => {
      // Update payment
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          ...(validatedData.status && { status: validatedData.status }),
          ...(validatedData.adminNotes !== undefined && { adminNotes: validatedData.adminNotes }),
          ...(validatedData.amount && { amount: validatedData.amount }),
          ...(validatedData.receiptUrl && { receiptUrl: validatedData.receiptUrl }),
          processedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true
            }
          },
          program: {
            select: {
              id: true,
              name: true,
              price: true,
              duration: true
            }
          }
        }
      })

      // Handle referral bonus for newly approved payments
      if (validatedData.status === 'APPROVED' && existingPayment.status !== 'APPROVED') {
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

    console.error('Payment update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/payments/[paymentId] - Remove/Cancel payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
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

    const { paymentId } = await params

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId }
    })

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Only allow deletion of pending payments or soft delete for others
    if (existingPayment.status === 'PENDING') {
      // Hard delete for pending payments
      await prisma.payment.delete({
        where: { id: paymentId }
      })
      
      return NextResponse.json({ message: 'Payment deleted successfully' })
    } else {
      // Soft delete for processed payments - mark as rejected
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REJECTED',
          adminNotes: 'Payment cancelled by admin',
          processedAt: new Date()
        }
      })
      
      return NextResponse.json({ 
        message: 'Payment cancelled successfully',
        payment: updatedPayment
      })
    }
  } catch (error) {
    console.error('Payment deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}