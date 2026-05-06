import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import RecentActivityClient from '@/components/RecentActivityClient';

export default async function RecentActivityPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const expenses = await prisma.velzia_expense.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { date: 'desc' },
  });

  const totalCount = await prisma.velzia_expense.count({ where: { userId } });

  return (
    <RecentActivityClient
      expenses={expenses.map(e => ({
        ...e,
        date: e.date,
      }))}
      totalCount={totalCount}
    />
  );
}