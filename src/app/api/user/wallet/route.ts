import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { TransactionType } from "@prisma/client"

// Withdrawal request schema
const withdrawalSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  method: z.enum(["BANK_TRANSFER", "MOBILE_MONEY", "PAYPAL"]),
  accountDetails: z.object({
    accountNumber: z.string().min(1, "Account number is required"),
    accountName: z.string().min(1, "Account name is required"),
    bankName: z.string().optional(),
    routingNumber: z.string().optional()
  }),
  notes: z.string().optional()
})

// GET /api/user/wallet - Get wallet balance and transactions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")
    const type = searchParams.get("type") // REFERRAL_BONUS, CASHBACK, WITHDRAWAL, etc.

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        wallet: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create wallet if it doesn't exist
    let wallet = user.wallet
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0
        }
      })
    }

    const whereClause: {
      walletId: string
      type?: TransactionType
    } = { walletId: wallet.id }
    if (type) {
      whereClause.type = type as TransactionType
    }

    const transactions = await prisma.walletLedger.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset
    })

    const totalCount = await prisma.walletLedger.count({
      where: whereClause
    })

    // Calculate summary statistics
    const totalEarnings = await prisma.walletLedger.aggregate({
      where: {
        walletId: wallet.id,
        type: "CREDIT"
      },
      _sum: {
        amount: true
      }
    })

    const totalWithdrawals = await prisma.walletLedger.aggregate({
      where: {
        walletId: wallet.id,
        type: "DEBIT"
      },
      _sum: {
        amount: true
      }
    })

    const pendingWithdrawals = await prisma.walletLedger.aggregate({
      where: {
        walletId: wallet.id,
        type: "DEBIT"
      },
      _sum: {
        amount: true
      }
    })

    return NextResponse.json({
      wallet,
      transactions,
      summary: {
        totalEarnings: totalEarnings._sum.amount || 0,
        totalWithdrawals: Math.abs(totalWithdrawals._sum.amount || 0),
        pendingWithdrawals: Math.abs(pendingWithdrawals._sum.amount || 0),
        availableBalance: wallet.balance
      },
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error) {
    console.error("Wallet fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/user/wallet - Request withdrawal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = withdrawalSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        wallet: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
    }

    const wallet = user.wallet

    // Check if user has sufficient balance
    if (wallet.balance < validatedData.amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Minimum withdrawal amount check (e.g., $10)
    const minimumWithdrawal = 10
    if (validatedData.amount < minimumWithdrawal) {
      return NextResponse.json({ 
        error: `Minimum withdrawal amount is $${minimumWithdrawal}` 
      }, { status: 400 })
    }

    // Create withdrawal transaction in pending status
    const result = await prisma.$transaction(async (tx: any) => {
      // Create withdrawal transaction
      const transaction = await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          type: "DEBIT",
          amount: validatedData.amount, // Positive amount for debit
          description: `Withdrawal request via ${validatedData.method}`,
          referenceType: "withdrawal"
        }
      })

      // Update wallet balance (reserve the amount)
      await tx.wallet.update({
        where: { userId: user.id },
        data: {
          balance: {
            decrement: validatedData.amount
          },
          updatedAt: new Date()
        }
      })

      return transaction
    })

    return NextResponse.json({
      message: "Withdrawal request submitted successfully",
      transaction: result
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    console.error("Withdrawal request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}