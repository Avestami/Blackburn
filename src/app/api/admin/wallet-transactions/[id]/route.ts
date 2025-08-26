import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const processTransactionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  adminNotes: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, adminNotes } = processTransactionSchema.parse(body);

    const transaction = await prisma.walletTransaction.findUnique({
      where: { id },
      include: { user: { include: { wallet: true } } },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.status !== 'PENDING') {
      return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 });
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    // Start a transaction to update both the wallet transaction and wallet balance
    const result = await prisma.$transaction(async (tx) => {
      // Update the transaction status
      const updatedTransaction = await tx.walletTransaction.update({
        where: { id },
        data: {
          status: newStatus,
          adminNotes,
          processedBy: session.user.id,
          processedAt: new Date(),
        },
      });

      // If approved, update the wallet balance
      if (action === 'APPROVE') {
        // Ensure user has a wallet
        let wallet = transaction.user.wallet;
        if (!wallet) {
          wallet = await tx.wallet.create({
            data: {
              userId: transaction.userId,
              balance: 0,
            },
          });
        }

        // Update wallet balance based on transaction type
        const balanceChange = transaction.type === 'DEPOSIT' 
          ? transaction.amount 
          : -transaction.amount;

        await tx.wallet.update({
          where: { userId: transaction.userId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });

        // Create wallet ledger entry
        await tx.walletLedger.create({
          data: {
            walletId: wallet.id,
            amount: balanceChange,
            type: transaction.type === 'DEPOSIT' ? 'CREDIT' : 'DEBIT',
            description: `${transaction.type} - ${transaction.type === 'DEPOSIT' ? 'Deposit approved' : 'Withdrawal approved'}`,
            referenceId: transaction.id,
            referenceType: 'wallet_transaction',
          },
        });
      }

      return updatedTransaction;
    });

    // Log admin action
    await prisma.adminAudit.create({
      data: {
        adminId: session.user.id,
        action: `WALLET_TRANSACTION_${action}`,
        target: 'wallet_transaction',
        targetId: id,
        details: {
          transactionType: transaction.type,
          amount: transaction.amount,
          userId: transaction.userId,
          adminNotes,
        },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing wallet transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}