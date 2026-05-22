import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import dynamic from 'next/dynamic';

const RecentActivityClient = dynamic(() => import('@/components/RecentActivityClient'), {
  loading: () => (
    <div className="min-h-screen pb-20 animate-pulse">
      <div className="h-16 bg-white/5 rounded"></div>
      <div className="px-4 py-6 space-y-6">
        <div className="h-12 bg-white/5 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-white/5 rounded-3xl"></div>
          ))}
        </div>
      </div>
    </div>
  )
});

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
        ocrText: e.ocrText ?? null,
      }))}
      totalCount={totalCount}
    />
  );
}