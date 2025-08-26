import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { PaymentStatus } from "@prisma/client"

// Subscription creation schema
const subscriptionSchema = z.object({
  programId: z.string().min(1, "Program ID is required"),
  paymentReceiptUrl: z.string().url("Valid receipt URL is required"),
  paymentAmount: z.number().positive("Payment amount must be positive")
})

// GET /api/user/subscriptions - Get user subscriptions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // ACTIVE, PENDING, EXPIRED, CANCELLED
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const whereClause: {
      userId: string
      status?: PaymentStatus
    } = { userId: user.id }
    if (status) {
      whereClause.status = status as PaymentStatus
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        program: true
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset
    })

    const totalCount = await prisma.payment.count({
      where: whereClause
    })

    return NextResponse.json({
      subscriptions: payments,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error) {
    console.error("Subscriptions fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/user/subscriptions - Create new subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = subscriptionSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if program exists
    const program = await prisma.program.findUnique({
      where: { id: validatedData.programId }
    })

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 })
    }

    // Check if user already has a pending payment for this program
    const existingPayment = await prisma.payment.findFirst({
      where: {
        userId: user.id,
        programId: validatedData.programId,
        status: "PENDING"
      }
    })

    if (existingPayment) {
      return NextResponse.json({ 
        error: "You already have a pending payment for this program" 
      }, { status: 400 })
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        programId: validatedData.programId,
        amount: validatedData.paymentAmount,
        receiptUrl: validatedData.paymentReceiptUrl,
        status: "PENDING"
      },
      include: {
        program: true
      }
    })

    return NextResponse.json({
      message: "Payment submitted successfully. Awaiting admin approval.",
      payment: payment
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    console.error("Subscription creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}