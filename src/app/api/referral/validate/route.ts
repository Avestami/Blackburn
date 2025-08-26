import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Validate referral code
export async function POST(request: NextRequest) {
  try {
    const { referralCode } = await request.json()

    if (!referralCode) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 })
    }

    // Find user with this referral code
    const referrer = await prisma.user.findUnique({
      where: { referralCode: referralCode.toUpperCase() },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        referralCode: true
      }
    })

    if (!referrer) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid referral code' 
      }, { status: 404 })
    }

    return NextResponse.json({
      valid: true,
      referrer: {
        name: `${referrer.firstName} ${referrer.lastName}`.trim(),
        email: referrer.email
      },
      message: `Valid referral code from ${`${referrer.firstName} ${referrer.lastName}`.trim() || referrer.email}`
    })
    
  } catch (error) {
    console.error('Error validating referral code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}