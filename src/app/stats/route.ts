import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expenses = await prisma.velzia_expense.aggregate({
    where: { userId },
    _sum: { amount: true },
  });

  const totalExpenses = expenses._sum.amount || 0;

  return NextResponse.json({
    success: true,
    totalExpenses,
    currency: 'COP',
    timestamp: new Date().toISOString(),
  });
}
