import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Get user's friends and friend requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get accepted friendships
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' }
        ]
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profile: {
              select: {
                profilePicture: true
              }
            }
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profile: {
              select: {
                profilePicture: true
              }
            }
          }
        }
      }
    });

    // Get pending friend requests (received)
    const pendingRequests = await prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING'
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profile: {
              select: {
                profilePicture: true
              }
            }
          }
        }
      }
    });

    // Get sent friend requests
    const sentRequests = await prisma.friendship.findMany({
      where: {
        requesterId: userId,
        status: 'PENDING'
      },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profile: {
              select: {
                profilePicture: true
              }
            }
          }
        }
      }
    });

    // Format friends list
    const friends = friendships.map(friendship => {
      const friend = friendship.requesterId === userId ? friendship.receiver : friendship.requester;
      return {
        id: friend.id,
        username: friend.username,
        firstName: friend.firstName,
        lastName: friend.lastName,
        profilePicture: friend.profile?.profilePicture,
        friendshipId: friendship.id,
        friendsSince: friendship.createdAt
      };
    });

    return NextResponse.json({
      friends,
      pendingRequests: pendingRequests.map(req => ({
        id: req.id,
        user: req.requester,
        createdAt: req.createdAt
      })),
      sentRequests: sentRequests.map(req => ({
        id: req.id,
        user: req.receiver,
        createdAt: req.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Send friend request
const sendRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId: receiverId } = sendRequestSchema.parse(body);
    const requesterId = session.user.id;

    // Check if trying to add themselves
    if (requesterId === receiverId) {
      return NextResponse.json({ error: 'Cannot add yourself as friend' }, { status: 400 });
    }

    // Check if user exists
    const receiverUser = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiverUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, receiverId },
          { requesterId: receiverId, receiverId: requesterId }
        ]
      }
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'ACCEPTED') {
        return NextResponse.json({ error: 'Already friends' }, { status: 400 });
      } else if (existingFriendship.status === 'PENDING') {
        return NextResponse.json({ error: 'Friend request already sent' }, { status: 400 });
      } else if (existingFriendship.status === 'BLOCKED') {
        return NextResponse.json({ error: 'Cannot send friend request' }, { status: 400 });
      }
    }

    // Create friend request
    const friendship = await prisma.friendship.create({
      data: {
        requesterId,
        receiverId,
        status: 'PENDING'
      },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profile: {
              select: {
                profilePicture: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Friend request sent successfully',
      friendship: {
        id: friendship.id,
        user: friendship.receiver,
        createdAt: friendship.createdAt
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('Error sending friend request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}