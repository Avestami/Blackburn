import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Verify program exists
    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: { id: true, name: true, duration: true }
    })

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Fetch payments for the program (subscriptions)
    const payments = await prisma.payment.findMany({
      where: { programId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    })

    // Transform payments data to match expected interface
    const transformedSubscriptions = payments.map(payment => ({
      id: payment.id,
      status: payment.status,
      startDate: payment.createdAt.toISOString(),
      endDate: new Date(payment.createdAt.getTime() + (program.duration * 24 * 60 * 60 * 1000)).toISOString(),
      user: {
        id: payment.user.id,
        name: payment.user.firstName && payment.user.lastName 
          ? `${payment.user.firstName} ${payment.user.lastName}` 
          : payment.user.firstName || payment.user.lastName,
        email: payment.user.email,
      },
      createdAt: payment.createdAt.toISOString()
    }))

    return NextResponse.json({
      subscriptions: transformedSubscriptions,
      program: {
        id: program.id,
        name: program.name
      }
    })

  } catch (error) {
    console.error('Error fetching program subscriptions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}