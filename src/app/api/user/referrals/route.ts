import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Referral creation schema
const referralSchema = z.object({
  referredEmail: z.string().email("Valid email is required"),
  referredName: z.string().min(1, "Name is required")
})

// GET /api/user/referrals - Get user's referral data
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }



    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        wallet: true,
        referrals: {
          include: {
            referredUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                createdAt: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        }

      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Calculate referral statistics
    const totalReferrals = user.referrals.length
    const successfulReferrals = user.referrals.filter((ref: any) => ref.status === "COMPLETED").length
    const pendingReferrals = user.referrals.filter((ref: any) => ref.status === "PENDING").length
    
    // Calculate total earnings from referrals
    const totalEarnings = 0 // TODO: Implement wallet transactions when available

    return NextResponse.json({
      wallet: user.wallet,

      referralStats: {
        totalReferrals,
        successfulReferrals,
        pendingReferrals,
        totalEarnings
      },
      referrals: user.referrals,
      referredBy: user.referredBy,

    })
  } catch (error) {
    console.error("Referrals fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/user/referrals - Create a new referral
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = referralSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is trying to refer themselves
    if (validatedData.referredEmail === user.email) {
      return NextResponse.json({ error: "You cannot refer yourself" }, { status: 400 })
    }

    // Check if the referred user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.referredEmail }
    })

    if (existingUser) {
      return NextResponse.json({ error: "User is already registered" }, { status: 400 })
    }

    // Check if user exists by email
    const referredUser = await prisma.user.findUnique({
      where: { email: validatedData.referredEmail }
    })

    if (!referredUser) {
      return NextResponse.json({ error: "User with this email does not exist" }, { status: 400 })
    }

    // Check if this user has already been referred by this user
    const existingReferral = await prisma.referral.findFirst({
      where: {
        referrerId: user.id,
        referredUserId: referredUser.id
      }
    })

    if (existingReferral) {
      return NextResponse.json({ error: "You have already referred this user" }, { status: 400 })
    }

    // Generate unique referral code
    const referralCode = `REF_${user.id}_${referredUser.id}_${Date.now()}`

    // Create the referral record
    const referral = await prisma.referral.create({
      data: {
        referrerId: user.id,
        referredUserId: referredUser.id,
        referralCode,
        status: "active"
      },
      include: {
        referrer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        referredUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // TODO: Send invitation email to the referred user
    // This would typically involve sending an email with a referral link
    // that includes the referrer's referral code

    return NextResponse.json({
      message: "Referral created successfully",
      referral
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    console.error("Referral creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}