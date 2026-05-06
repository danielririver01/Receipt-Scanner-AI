import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import DashboardContent from '@/components/DashboardContent';

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

  const expenses = await prisma.velzia_expense.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { date: 'desc' },
  });

  const sixMonthsAgo = new Date(year, month - 7, 1);
  const monthlyExpenses = await prisma.velzia_expense.findMany({
    where: { userId, date: { gte: sixMonthsAgo } },
    include: { category: true },
  });

  const budgets = await prisma.velzia_budget.findMany({
    where: { userId },
    include: { category: true },
  });

  const totalExpensesCount = await prisma.velzia_expense.count({ where: { userId } });

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