import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import dynamicImport from 'next/dynamic';

export const dynamic = 'force-dynamic';

const DashboardContent = dynamicImport(() => import('@/components/DashboardContent'), {
  loading: () => (
    <div className="space-y-10 animate-pulse">
      <div className="h-12 w-64 bg-white/5 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 bg-white/5 rounded-3xl"></div>
        ))}
      </div>
    </div>
  )
});

interface DashboardPageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await prisma.users.findUnique({
    where: { clerk_id: userId }
  });

  if (!user) {
    redirect('/not-registered');
  }

  const params = await searchParams;
  const now = new Date();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const year = params.year ? parseInt(params.year) : now.getFullYear();

  const expenses = await prisma.expense.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { date: 'desc' },
  });

  const sixMonthsAgo = new Date(year, month - 7, 1);
  const monthlyExpenses = await prisma.expense.findMany({
    where: { userId, date: { gte: sixMonthsAgo } },
    include: { category: true },
  });

  const budgets = await prisma.budget.findMany({
    where: { userId },
    include: { category: true },
  });

  const totalExpensesCount = await prisma.expense.count({ where: { userId } });

  return (
    <DashboardContent
      expenses={expenses}
      budgets={budgets}
      totalExpensesCount={totalExpensesCount}
      month={month}
      year={year}
      monthlyExpenses={monthlyExpenses}
    />
  );
}