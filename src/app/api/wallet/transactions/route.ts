import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createTransactionSchema = z.object({
  type: z.enum(['DEPOSIT', 'WITHDRAWAL']),
  amount: z.number().positive(),
  receiptUrl: z.string().optional(),
  cardNumber: z.string().optional(),
  cardHolderName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTransactionSchema.parse(body);

    // Validate required fields based on transaction type
    if (validatedData.type === 'DEPOSIT' && !validatedData.receiptUrl) {
      return NextResponse.json({ error: 'Receipt URL is required for deposits' }, { status: 400 });
    }

    if (validatedData.type === 'WITHDRAWAL' && (!validatedData.cardNumber || !validatedData.cardHolderName)) {
      return NextResponse.json({ error: 'Card number and holder name are required for withdrawals' }, { status: 400 });
    }

    // For withdrawals, check if user has sufficient balance
    if (validatedData.type === 'WITHDRAWAL') {
      const wallet = await prisma.wallet.findUnique({
        where: { userId: session.user.id }
      });

      if (!wallet || wallet.balance < validatedData.amount) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
      }
    }

    const transaction = await prisma.walletTransaction.create({
      data: {
        userId: session.user.id,
        type: validatedData.type,
        amount: validatedData.amount,
        receiptUrl: validatedData.receiptUrl,
        cardNumber: validatedData.cardNumber,
        cardHolderName: validatedData.cardHolderName,
      },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error creating wallet transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactions = await prisma.walletTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}