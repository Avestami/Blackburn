import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PaymentStatus } from '@prisma/client'
import { z } from 'zod'

const bulkUpdateSchema = z.object({
  paymentIds: z.array(z.string().uuid()),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  adminNotes: z.string().optional()
})

// GET /api/admin/payments - Get all payments for admin review
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const paymentMethod = searchParams.get('paymentMethod')
    const programId = searchParams.get('programId')
    const userId = searchParams.get('userId')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const skip = (page - 1) * limit

    const whereClause: {
      status?: PaymentStatus
      paymentMethod?: string
      programId?: string
      userId?: string
    } = {}
    
    if (status) whereClause.status = status as PaymentStatus
    if (paymentMethod) whereClause.paymentMethod = paymentMethod
    if (programId) whereClause.programId = programId
    if (userId) whereClause.userId = userId

    const [payments, total, stats] = await Promise.all([
      prisma.payment.findMany({
        where: whereClause,
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
              category: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.payment.count({ where: whereClause }),
      prisma.payment.groupBy({
        by: ['status'],
        _count: { _all: true },
        _sum: { amount: true }
      })
    ])

    // Calculate summary statistics
    const summary = {
      total: stats.reduce((acc: number, stat: any) => acc + stat._count._all, 0),
      pending: stats.find((s: any) => s.status === 'PENDING')?._count._all || 0,
      approved: stats.find((s: any) => s.status === 'APPROVED')?._count._all || 0,
      rejected: stats.find((s: any) => s.status === 'REJECTED')?._count._all || 0,
      totalAmount: stats.reduce((acc: number, stat: any) => acc + Number(stat._sum.amount || 0), 0),
      pendingAmount: Number(stats.find((s: any) => s.status === 'PENDING')?._sum.amount || 0),
      approvedAmount: Number(stats.find((s: any) => s.status === 'APPROVED')?._sum.amount || 0)
    }

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      summary
    })
  } catch (error) {
    console.error('Error fetching admin payments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/payments - Bulk update payment status
export async function PUT(request: NextRequest) {
  try {
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
    const validatedData = bulkUpdateSchema.parse(body)

    // Get all payments to update
    const paymentsToUpdate = await prisma.payment.findMany({
      where: {
        id: { in: validatedData.paymentIds }
      },
      include: {
        program: true,
        user: true
      }
    })

    if (paymentsToUpdate.length === 0) {
      return NextResponse.json(
        { error: 'No payments found to update' },
        { status: 404 }
      )
    }

    // Use transaction for bulk updates
    const results = await prisma.$transaction(async (tx: any) => {
      const updatedPayments = []

      for (const payment of paymentsToUpdate) {
        // Update payment status
        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: validatedData.status,
            adminNotes: validatedData.adminNotes,
            processedAt: new Date()
          }
        })

        updatedPayments.push(updatedPayment)

        // Handle referral bonus for approved payments
        if (validatedData.status === 'APPROVED') {
          // Handle referral bonus
          const referral = await tx.referral.findFirst({
            where: {
              referredUserId: payment.userId,
              status: 'completed'
            }
          })

          if (referral) {
            const bonusAmount = Number(payment.amount) * 0.1 // 10% referral bonus
            
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
                  description: `Referral bonus for ${payment.user.firstName || payment.user.email}`,
                  referenceId: payment.id,
                  referenceType: 'payment'
                }
              })
            }
          }
        }
      }

      return updatedPayments
    })

    return NextResponse.json({
      message: `Successfully updated ${results.length} payments`,
      updatedPayments: results
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error bulk updating payments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}