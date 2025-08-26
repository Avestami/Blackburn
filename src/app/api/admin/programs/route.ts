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
  status: z.enum(['active', 'inactive']).optional(),
})

// Validation schema for creating programs
const createProgramSchema = z.object({
  name: z.string().min(1, 'Program name is required'),
  description: z.string().min(1, 'Program description is required'),
  price: z.number().min(0, 'Price must be positive'),
  duration: z.number().min(1, 'Duration must be at least 1 day')
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
      status: searchParams.get('status') || undefined,
    }

    const { page, limit, search, status } = querySchema.parse(queryParams)
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Build where clause for filtering
    const whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }

    if (status) {
      whereClause.isActive = status === 'active'
    }

    // Fetch programs with pagination and subscription counts
    const [programs, totalCount] = await Promise.all([
      prisma.program.findMany({
        where: whereClause,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              payments: true,
            }
          }
        }
      }),
      prisma.program.count({ where: whereClause })
    ])

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limitNum)

    // Calculate summary statistics for all programs
    const allPrograms = await prisma.program.findMany({
      include: {
        _count: {
          select: {
            payments: true,
          }
        }
      }
    })

    const stats = {
      total: allPrograms.length,
      active: allPrograms.filter(p => p.isActive).length,
      inactive: allPrograms.filter(p => !p.isActive).length,
      totalSubscriptions: allPrograms.reduce((sum, p) => sum + p._count.payments, 0),
      totalRevenue: allPrograms.reduce((sum, p) => sum + (p.price * p._count.payments), 0),
    }

    return NextResponse.json({
      programs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: totalPages
      },
      stats,
      totalPages // For backward compatibility
    })

  } catch (error) {
    console.error('Error fetching programs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/programs - Create new program
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const validatedData = createProgramSchema.parse(body)

    // Check if program with same name already exists
    const existingProgram = await prisma.program.findFirst({
      where: {
        name: {
          contains: validatedData.name
        }
      }
    })

    if (existingProgram) {
      return NextResponse.json(
        { error: 'Program with this name already exists' },
        { status: 400 }
      )
    }

    const program = await prisma.program.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        duration: validatedData.duration,
        isActive: true
      }
    })

    return NextResponse.json(program, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Program creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}