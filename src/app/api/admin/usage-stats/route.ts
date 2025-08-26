import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/usage-stats - Get admin dashboard statistics
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

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Fetch comprehensive statistics
    const [userStats, paymentStats, programStats, revenueStats] = await Promise.all([
      // User statistics
      prisma.user.aggregate({
        _count: { id: true }
      }),
      
      // Payment statistics
      Promise.all([
        prisma.payment.count(),
        prisma.payment.count({ where: { status: 'PENDING' } }),
        prisma.payment.count({ where: { status: 'APPROVED' } }),
        prisma.payment.count({ where: { status: 'REJECTED' } })
      ]),
      
      // Program statistics
      Promise.all([
        prisma.program.count(),
        prisma.program.count({ where: { isActive: true } }),
        prisma.payment.count({ where: { status: 'APPROVED' } }),
        prisma.walletTransaction.count({ where: { status: 'APPROVED' } })
      ]),
      
      // Revenue statistics
      Promise.all([
        prisma.payment.aggregate({
          where: { status: 'APPROVED' },
          _sum: { amount: true }
        }),
        prisma.payment.aggregate({
          where: { status: 'PENDING' },
          _sum: { amount: true }
        })
      ])
    ])

    const [totalPayments, pendingPayments, approvedPayments, rejectedPayments] = paymentStats
    const [totalPrograms, activePrograms, approvedPaymentsCount, approvedTransactions] = programStats
    const [approvedRevenue, pendingRevenue] = revenueStats

    // Calculate growth metrics (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const [recentUsers, previousUsers, recentPayments, previousPayments] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      }),
      prisma.payment.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          },
          status: 'APPROVED'
        }
      }),
      prisma.payment.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          },
          status: 'APPROVED'
        }
      })
    ])

    // Calculate growth percentages
    const userGrowth = previousUsers > 0 ? ((recentUsers - previousUsers) / previousUsers) * 100 : 0
    const paymentGrowth = previousPayments > 0 ? ((recentPayments - previousPayments) / previousPayments) * 100 : 0

    const stats = {
      users: {
        total: userStats._count.id,
        growth: Math.round(userGrowth * 100) / 100,
        recent: recentUsers
      },
      payments: {
        total: totalPayments,
        pending: pendingPayments,
        approved: approvedPayments,
        rejected: rejectedPayments,
        growth: Math.round(paymentGrowth * 100) / 100
      },
      programs: {
        total: totalPrograms,
        active: activePrograms,
        inactive: totalPrograms - activePrograms
      },
      transactions: {
        total: approvedTransactions,
        approved: approvedTransactions,
        pending: pendingPayments
      },
      revenue: {
        total: approvedRevenue._sum.amount || 0,
        pending: pendingRevenue._sum.amount || 0,
        currency: 'USD'
      },
      overview: {
        totalUsers: userStats._count.id,
        totalPayments: totalPayments,
        totalPrograms: totalPrograms,
        totalRevenue: approvedRevenue._sum.amount || 0,
        pendingPayments: pendingPayments,
        activePrograms: activePrograms
      }
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error('Error fetching usage stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}