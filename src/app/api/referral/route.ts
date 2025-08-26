import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

// Generate referral code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has a referral code
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { referralCode: true }
    })

    if (user?.referralCode) {
      return NextResponse.json({ 
        referralCode: user.referralCode,
        message: 'Referral code already exists'
      })
    }

    // Generate unique referral code
    let referralCode = ''
    let isUnique = false
    
    while (!isUnique) {
      referralCode = nanoid(8).toUpperCase()
      
      const existingCode = await prisma.user.findUnique({
        where: { referralCode }
      })
      
      if (!existingCode) {
        isUnique = true
      }
    }

    // Update user with referral code
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { referralCode },
      select: { referralCode: true }
    })

    return NextResponse.json({
      referralCode: updatedUser.referralCode,
      message: 'Referral code generated successfully'
    })
    
  } catch (error) {
    console.error('Error generating referral code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get user's referral information
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's referral code and referral stats
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        referralCode: true,
        referredBy: true,
        referredUsers: {
          include: {
            referredUser: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                createdAt: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate referral stats
    const totalReferrals = user.referredUsers.length
    const totalCashback = user.referredUsers.reduce((sum, ref) => {
      return sum + (ref.cashbackAmount || 0)
    }, 0)
    const paidCashback = user.referredUsers
      .filter(ref => ref.cashbackPaid)
      .reduce((sum, ref) => sum + (ref.cashbackAmount || 0), 0)
    const pendingCashback = totalCashback - paidCashback

    return NextResponse.json({
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      stats: {
        totalReferrals,
        totalCashback,
        paidCashback,
        pendingCashback
      },
      referrals: user.referredUsers
    })
    
  } catch (error) {
    console.error('Error fetching referral info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}