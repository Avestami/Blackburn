import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Accept or reject friend request
const updateRequestSchema = z.object({
  action: z.enum(['accept', 'reject', 'remove'])
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ friendshipId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = updateRequestSchema.parse(body);
    const { friendshipId } = await params;
    const userId = session.user.id;

    // Find the friendship
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!friendship) {
      return NextResponse.json({ error: 'Friendship not found' }, { status: 404 });
    }

    // Check if user is involved in this friendship
    if (friendship.requesterId !== userId && friendship.receiverId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (action === 'accept') {
      // Only the receiver can accept a request
      if (friendship.receiverId !== userId) {
        return NextResponse.json({ error: 'Only the receiver can accept a friend request' }, { status: 403 });
      }

      if (friendship.status !== 'PENDING') {
        return NextResponse.json({ error: 'Friend request is not pending' }, { status: 400 });
      }

      const updatedFriendship = await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: 'ACCEPTED' },
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

      return NextResponse.json({
        message: 'Friend request accepted',
        friend: {
          id: updatedFriendship.requester.id,
          username: updatedFriendship.requester.username,
          firstName: updatedFriendship.requester.firstName,
          lastName: updatedFriendship.requester.lastName,
          profilePicture: updatedFriendship.requester.profile?.profilePicture,
          friendshipId: updatedFriendship.id,
          friendsSince: updatedFriendship.updatedAt
        }
      });
    }

    if (action === 'reject') {
      // Only the receiver can reject a request
      if (friendship.receiverId !== userId) {
        return NextResponse.json({ error: 'Only the receiver can reject a friend request' }, { status: 403 });
      }

      if (friendship.status !== 'PENDING') {
        return NextResponse.json({ error: 'Friend request is not pending' }, { status: 400 });
      }

      await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: 'REJECTED' }
      });

      return NextResponse.json({ message: 'Friend request rejected' });
    }

    if (action === 'remove') {
      // Either user can remove/unfriend
      if (friendship.status !== 'ACCEPTED') {
        return NextResponse.json({ error: 'Can only remove accepted friendships' }, { status: 400 });
      }

      await prisma.friendship.delete({
        where: { id: friendshipId }
      });

      return NextResponse.json({ message: 'Friend removed successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('Error updating friendship:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete friendship (same as remove)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ friendshipId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { friendshipId } = await params;
    const userId = session.user.id;

    // Find the friendship
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId }
    });

    if (!friendship) {
      return NextResponse.json({ error: 'Friendship not found' }, { status: 404 });
    }

    // Check if user is involved in this friendship
    if (friendship.requesterId !== userId && friendship.receiverId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.friendship.delete({
      where: { id: friendshipId }
    });

    return NextResponse.json({ message: 'Friendship deleted successfully' });
  } catch (error) {
    console.error('Error deleting friendship:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}