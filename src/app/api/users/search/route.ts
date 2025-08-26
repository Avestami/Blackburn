import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Search users by ID or username
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: 'Search query must be at least 2 characters' }, { status: 400 });
    }

    const currentUserId = session.user.id;
    const searchQuery = query.trim();

    // Search by ID (exact match) or username (partial match)
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            id: { not: currentUserId } // Exclude current user
          },
          {
            isActive: true // Only active users
          },
          {
            OR: [
              {
                id: searchQuery // Exact ID match
              },
              {
                username: {
                  contains: searchQuery
                }
              },
              {
                firstName: {
                  contains: searchQuery
                }
              },
              {
                lastName: {
                  contains: searchQuery
                }
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        profile: {
          select: {
            profilePicture: true
          }
        },
        // Check friendship status
        sentFriendRequests: {
          where: {
            receiverId: currentUserId
          },
          select: {
            id: true,
            status: true
          }
        },
        receivedFriendRequests: {
          where: {
            requesterId: currentUserId
          },
          select: {
            id: true,
            status: true
          }
        }
      },
      take: limit,
      orderBy: [
        {
          username: 'asc'
        }
      ]
    });

    // Format results with friendship status
    const formattedUsers = users.map(user => {
      let friendshipStatus = 'none';
      let friendshipId = null;

      // Check if there's an existing friendship
      const sentRequest = user.receivedFriendRequests[0];
      const receivedRequest = user.sentFriendRequests[0];

      if (sentRequest) {
        friendshipStatus = sentRequest.status.toLowerCase();
        friendshipId = sentRequest.id;
        if (friendshipStatus === 'pending') {
          friendshipStatus = 'sent'; // Current user sent request
        }
      } else if (receivedRequest) {
        friendshipStatus = receivedRequest.status.toLowerCase();
        friendshipId = receivedRequest.id;
        if (friendshipStatus === 'pending') {
          friendshipStatus = 'received'; // Current user received request
        }
      }

      return {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profile?.profilePicture,
        friendshipStatus,
        friendshipId
      };
    });

    return NextResponse.json({
      users: formattedUsers,
      total: formattedUsers.length
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}