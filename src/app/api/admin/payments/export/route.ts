import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PaymentStatus } from '@prisma/client'

// GET /api/admin/payments/export - Export payments data as CSV
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const format = searchParams.get('format') || 'csv' // csv or json

    // Build where clause for filtering
    const whereClause: any = {}
    
    if (status && status !== 'all') {
      whereClause.status = status as PaymentStatus
    }
    
    if (startDate) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        gte: new Date(startDate)
      }
    }
    
    if (endDate) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lte: new Date(endDate)
      }
    }

    // Fetch payments data
    const payments = await prisma.payment.findMany({
      where: whereClause,
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
            price: true,
            category: true,
            duration: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (format === 'json') {
      // Return JSON format
      return NextResponse.json({
        payments,
        exportedAt: new Date().toISOString(),
        totalRecords: payments.length
      })
    }

    // Generate CSV format
    const csvHeaders = [
      'Payment ID',
      'User Name',
      'User Email',
      'Username',
      'Telegram Username',
      'Program Name',
      'Program Category',
      'Amount',
      'Currency',
      'Status',
      'Payment Method',
      'Receipt URL',
      'Admin Notes',
      'Created At',
      'Updated At',
      'Processed At'
    ]

    const csvRows = payments.map(payment => [
      payment.id,
      `${payment.user.firstName || ''} ${payment.user.lastName || ''}`.trim() || 'N/A',
      payment.user.email || 'N/A',
      payment.user.username || 'N/A',
      payment.user.telegramId || 'N/A',
      payment.program.name,
      payment.program.category || 'N/A',
      payment.amount,
      payment.currency || 'USD',
      payment.status,
      'N/A', // Payment method not available
      payment.receiptUrl || 'N/A',
      payment.adminNotes || 'N/A',
      payment.createdAt.toISOString(),
      payment.updatedAt.toISOString(),
      payment.processedAt?.toISOString() || 'N/A'
    ])

    // Escape CSV values and handle commas/quotes
    const escapeCsvValue = (value: any): string => {
      if (value === null || value === undefined) return 'N/A'
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }

    const csvContent = [
      csvHeaders.map(escapeCsvValue).join(','),
      ...csvRows.map(row => row.map(escapeCsvValue).join(','))
    ].join('\n')

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `payments_export_${timestamp}.csv`

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Payment export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/payments/export - Export filtered payments with custom parameters
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
    const {
      paymentIds,
      status,
      startDate,
      endDate,
      format = 'csv',
      includeUserDetails = true,
      includeProgramDetails = true
    } = body

    // Build where clause
    const whereClause: any = {}
    
    if (paymentIds && paymentIds.length > 0) {
      whereClause.id = { in: paymentIds }
    }
    
    if (status && status !== 'all') {
      whereClause.status = status as PaymentStatus
    }
    
    if (startDate) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        gte: new Date(startDate)
      }
    }
    
    if (endDate) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lte: new Date(endDate)
      }
    }

    // Fetch payments with includes
    const payments = await prisma.payment.findMany({
      where: whereClause,
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
            price: true,
            category: true,
            duration: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (format === 'json') {
      return NextResponse.json({
        payments,
        exportedAt: new Date().toISOString(),
        totalRecords: payments.length,
        filters: { status, startDate, endDate }
      })
    }

    // Generate CSV with dynamic headers based on includes
    const baseHeaders = ['Payment ID', 'Amount', 'Currency', 'Status', 'Payment Method', 'Created At']
    const userHeaders = includeUserDetails ? ['User Name', 'User Email', 'Username', 'Telegram Username'] : []
    const programHeaders = includeProgramDetails ? ['Program Name', 'Program Category', 'Program Duration'] : []
    const additionalHeaders = ['Receipt URL', 'Admin Notes', 'Updated At', 'Processed At']
    
    const csvHeaders = [...baseHeaders, ...userHeaders, ...programHeaders, ...additionalHeaders]

    const csvRows = payments.map(payment => {
      const baseData = [
        payment.id,
        payment.amount,
        payment.currency || 'USD',
        payment.status,
        'N/A', // Payment method not available
        payment.createdAt.toISOString()
      ]
      
      const userData = includeUserDetails ? [
        `${payment.user.firstName || ''} ${payment.user.lastName || ''}`.trim() || 'N/A',
        payment.user.email || 'N/A',
        payment.user.username || 'N/A',
        payment.user.telegramId || 'N/A'
      ] : []
      
      const programData = includeProgramDetails ? [
        payment.program.name || 'N/A',
        payment.program.category || 'N/A',
        payment.program.duration ? `${payment.program.duration} days` : 'N/A'
      ] : []
      
      const additionalData = [
        payment.receiptUrl || 'N/A',
        payment.adminNotes || 'N/A',
        payment.updatedAt.toISOString(),
        payment.processedAt?.toISOString() || 'N/A'
      ]
      
      return [...baseData, ...userData, ...programData, ...additionalData]
    })

    // Escape CSV values
    const escapeCsvValue = (value: any): string => {
      if (value === null || value === undefined) return 'N/A'
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }

    const csvContent = [
      csvHeaders.map(escapeCsvValue).join(','),
      ...csvRows.map(row => row.map(escapeCsvValue).join(','))
    ].join('\n')

    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `payments_custom_export_${timestamp}.csv`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Custom payment export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}