import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for query parameters
const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

export async function GET(request: NextRequest) {
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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      search: searchParams.get('search') || undefined,
      role: searchParams.get('role') || undefined,
      status: searchParams.get('status') || undefined,
    }

    const { page, limit, search, role, status } = querySchema.parse(queryParams)
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Build where clause for filtering
    const whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { username: { contains: search } },
        { email: { contains: search } },
        { telegramId: { contains: search } },
      ]
    }

    if (role) {
      whereClause.role = role
    }

    if (status) {
      whereClause.isActive = status === 'active'
    }

    // Fetch users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          email: true,
          telegramId: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            select: {
              age: true,
              gender: true,
              height: true,
              activityLevel: true,
              fitnessGoals: true,
            }
          },
          _count: {
            select: {
              payments: true,
              workouts: true,
            }
          },
          wallet: {
            select: {
              balance: true,
            }
          }
        }
      }),
      prisma.user.count({ where: whereClause })
    ])

    // Transform users data to match expected interface
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || user.lastName,
      email: user.email,
      telegramId: user.telegramId,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      profile: user.profile,
      _count: user._count,
      wallet: user.wallet
    }))

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limitNum)

    // Calculate summary statistics
    const allUsers = await prisma.user.findMany({
      select: {
        role: true,
        isActive: true,
        _count: {
          select: {
            payments: true,
          }
        }
      }
    })

    const stats = {
      total: allUsers.length,
      active: allUsers.filter(u => u.isActive).length,
      inactive: allUsers.filter(u => !u.isActive).length,
      admins: allUsers.filter(u => ['ADMIN', 'SUPER_ADMIN'].includes(u.role)).length,
      totalPayments: allUsers.reduce((sum, u) => sum + u._count.payments, 0),
      totalSubscriptions: allUsers.reduce((sum, u) => sum + u._count.payments, 0),
    }

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: totalPages
      },
      stats
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}