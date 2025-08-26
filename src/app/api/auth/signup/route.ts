import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Signup validation schema
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  referralCode: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = signupSchema.parse(body)

    const { email, username, password, referralCode } = validatedData

    // Check if user already exists with this email
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Check if username is already taken
    const existingUserByUsername = await prisma.user.findFirst({
      where: { username }
    })

    if (existingUserByUsername) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 400 }
      )
    }

    // Validate referral code if provided
    let referrer = null
    if (referralCode) {
      referrer = await prisma.user.findUnique({
        where: { referralCode: referralCode.toUpperCase() },
        select: { id: true, referralCode: true }
      })
      
      if (!referrer) {
        return NextResponse.json(
          { error: 'Invalid referral code' },
          { status: 400 }
        )
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Use transaction to create user and referral record
    const result = await prisma.$transaction(async (tx) => {
      // Create the user
      const user = await tx.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          referredBy: referralCode?.toUpperCase() || null,
        },
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true
        }
      })

      // Create referral record if referral code was used
      if (referrer) {
        await tx.referral.create({
          data: {
            referrerId: referrer.id,
            referredUserId: user.id,
            referralCode: referrer.referralCode || '',
            cashbackAmount: 50000, // 50,000 IRT cashback for referrer
            status: 'active'
          }
        })

        // Create wallet for referrer if doesn't exist
        await tx.wallet.upsert({
          where: { userId: referrer.id },
          update: {},
          create: {
            userId: referrer.id,
            balance: 0
          }
        })

        // Add cashback to referrer's wallet
        await tx.wallet.update({
          where: { userId: referrer.id },
          data: { balance: { increment: 50000 } }
        })

        // Create wallet ledger entry
        const referrerWallet = await tx.wallet.findUnique({
          where: { userId: referrer.id }
        })

        if (referrerWallet) {
          await tx.walletLedger.create({
            data: {
              walletId: referrerWallet.id,
              amount: 50000,
              type: 'CREDIT',
              description: `Referral bonus for inviting ${user.username}`,
              referenceId: user.id,
              referenceType: 'referral'
            }
          })
        }
      }

      return user
    })

    const user = result

    return NextResponse.json(
      { 
        message: 'Account created successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          createdAt: user.createdAt
        }
      },
      { status: 201 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Signup API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}