import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import ReceiptScanner from '@/components/ReceiptScanner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Wallet, Receipt, TrendingUp, Calendar } from 'lucide-react';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Get current month expenses
  const expenses = await prisma.expense.findMany({
    where: {
      userId,
      date: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      },
    },
    include: { category: true },
    orderBy: { date: 'desc' },
  });

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Get budgets for current month
  const budgets = await prisma.budget.findMany({
    where: { userId, month, year },
    include: { category: true },
  });

  const totalBudget = budgets.reduce((acc, curr) => acc + curr.amount, 0);
  const budgetProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
        <p className="text-gray-500 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {format(now, "MMMM yyyy", { locale: es })}
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="obsidian-card rounded-3xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl glass-container flex items-center justify-center text-orange-500">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Gastos Mensuales</span>
          </div>
          <div>
            <span className="text-4xl font-bold">${totalSpent.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-orange-500 h-full transition-all duration-1000"
              style={{ width: `${Math.min(budgetProgress, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="obsidian-card rounded-3xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl glass-container flex items-center justify-center text-blue-500">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Presupuesto Total</span>
          </div>
          <div>
            <span className="text-4xl font-bold">${totalBudget.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
          </div>
          <p className="text-sm text-gray-500">
            {totalBudget > 0
              ? `${budgetProgress.toFixed(1)}% utilizado este mes`
              : "Sin presupuesto configurado"}
          </p>
        </div>

        <div className="obsidian-card rounded-3xl p-6 flex flex-col gap-4 lg:hidden xl:flex">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl glass-container flex items-center justify-center text-purple-500">
              <Receipt className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Tickets Procesados</span>
          </div>
          <div>
            <span className="text-4xl font-bold">{expenses.length}</span>
          </div>
          <p className="text-sm text-gray-500">Escaneos completados con éxito</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* OCR Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold px-2">Nuevo Registro</h2>
          <ReceiptScanner />
        </section>

        {/* Recent Activity */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold px-2 flex justify-between items-center">
            Actividad Reciente
            <Link href="/dashboard" className="text-sm font-medium text-orange-500 hover:underline">Ver todo</Link>
          </h2>
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div key={expense.id} className="obsidian-card rounded-2xl p-4 flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl glass-container flex items-center justify-center text-gray-400 group-hover:text-orange-500 transition-colors">
                  <Receipt className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-white uppercase tracking-tight">{expense.description}</p>
                  <p className="text-sm text-gray-500">{format(new Date(expense.date), "dd MMM yyyy", { locale: es })} • {expense.category.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">-${expense.amount.toFixed(2)}</p>
                </div>
              </div>
            ))}
            {expenses.length === 0 && (
              <div className="glass-container rounded-2xl p-10 text-center text-gray-500 border-dashed border-white/10">
                No hay gastos registrados este mes.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
