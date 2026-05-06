'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Wallet, Receipt, TrendingUp, Sparkles, ArrowRight, TrendingDown } from 'lucide-react';
import ReceiptScanner from '@/components/ReceiptScanner';
import ChartsSection from '@/components/ChartsSection';
import { Suspense } from 'react';

interface Expense {
  id: string;
  description: string;
  date: Date;
  amount: number;
  category: { name: string };
}

interface Budget {
  amount: number;
}

interface DashboardContentProps {
  expenses: Expense[];
  budgets: Budget[];
  totalExpensesCount: number;
  month: number;
  year: number;
  monthlyExpenses: Expense[];
}

export default function DashboardContent({
  expenses,
  budgets,
  totalExpensesCount,
  month,
  year,
  monthlyExpenses,
}: DashboardContentProps) {
  const totalSpent = expenses.reduce((acc: number, curr: { amount: number }) => acc + curr.amount, 0);
  const totalBudget = budgets.reduce((acc: number, curr: { amount: number }) => acc + curr.amount, 0);
  const budgetProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const remaining = totalBudget - totalSpent;
  const isOverBudget = remaining < 0;

  const recentExpenses = expenses.slice(0, 6);

  return (
    <div className="space-y-10">
      <motion.header
        className="flex flex-col gap-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight">
              <span className="accent-text">Panel</span> de Control
            </h1>
            <p className="text-sm text-gray-500 mt-2">Todos tus gastos</p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl glass-container">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium text-gray-300">Sistema Activo</span>
          </div>
        </div>
      </motion.header>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.1 } }
        }}
      >
        <motion.div
          className="stat-card rounded-3xl p-6 group relative overflow-hidden"
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } }
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />

          <div className="flex items-center justify-between mb-6 relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center glow-icon">
              <Wallet className="w-7 h-7 text-orange-500" />
            </div>
            <span className="badge badge-orange">Total Acumulado</span>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Gastado</p>
            <p className="text-4xl font-black tracking-tight">
              ${totalSpent.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p className="text-sm text-gray-500">COP</p>
          </div>

          {totalBudget > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">{budgetProgress.toFixed(0)}% utilizado</span>
                <span className="text-gray-500">${totalBudget.toLocaleString('es-CO')} budget</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: isOverBudget
                      ? 'linear-gradient(90deg, #ef4444, #f87171)'
                      : 'linear-gradient(90deg, #f97316, #fb923c)'
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(budgetProgress, 100)}%` }}
                  transition={{ duration: 1, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
                />
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          className="stat-card rounded-3xl p-6 group relative overflow-hidden"
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } }
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />

          <div className="flex items-center justify-between mb-6 relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-blue-500" />
            </div>
            <span className={`badge ${isOverBudget ? 'badge-ruby' : 'badge-emerald'}`}>
              {isOverBudget ? 'Sobre presupuesto' : 'En presupuesto'}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Presupuesto Mensual</p>
            <p className="text-4xl font-black tracking-tight">
              ${totalBudget.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p className="text-sm text-gray-500">
              {remaining >= 0
                ? `${remaining.toLocaleString('es-CO')} restante`
                : `${Math.abs(remaining).toLocaleString('es-CO')} sobre presupuesto`
              }
            </p>
          </div>
        </motion.div>

        <motion.div
          className="stat-card rounded-3xl p-6 group relative overflow-hidden md:col-span-2 lg:col-span-1"
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } }
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />

          <div className="flex items-center justify-between mb-6 relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 flex items-center justify-center">
              <Receipt className="w-7 h-7 text-violet-500" />
            </div>
            <span className="badge badge-emerald">Historial</span>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Gastos Registrados</p>
            <div className="flex items-baseline gap-3">
              <p className="text-5xl font-black tracking-tight">{totalExpensesCount}</p>
              <span className="text-sm text-gray-500">registros</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span>Seguimiento activo</span>
          </div>
        </motion.div>
      </motion.div>

      <ChartsSection
        expenses={expenses}
        monthlyExpenses={monthlyExpenses}
        month={month}
        year={year}
      />

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-5 gap-8"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <section className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-orange-500" />
              </span>
              Nuevo Registro
            </h2>
          </div>
          <Suspense fallback={
            <div className="obsidian-card rounded-[2.5rem] p-12 text-center animate-pulse">
              <div className="w-16 h-16 bg-white/5 rounded-full mx-auto mb-4"></div>
              <div className="h-6 w-48 bg-white/5 mx-auto rounded"></div>
            </div>
          }>
            <ReceiptScanner />
          </Suspense>
        </section>

        <section className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold px-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-gray-400" />
              Actividad Reciente
            </span>
            <Link href="/dashboard/activity" className="text-sm font-medium text-orange-500 hover:text-orange-400 flex items-center gap-1 group">
              Ver todo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </h2>

          <div className="space-y-3">
            {recentExpenses.map((expense, index) => (
              <motion.div
                key={expense.id}
                className="obsidian-card rounded-2xl p-4 flex items-center gap-4 group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.4 }}
                whileHover={{ scale: 1.02, x: 4 }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/10 to-transparent flex items-center justify-center border border-orange-500/20 group-hover:border-orange-500/40 transition-colors">
                  <Receipt className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate text-white uppercase tracking-tight text-sm">{expense.description}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {format(new Date(expense.date), "dd MMM", { locale: es })} • {expense.category.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-white">${expense.amount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                </div>
              </motion.div>
            ))}

            {recentExpenses.length === 0 && (
              <div className="obsidian-card rounded-2xl p-10 text-center border-dashed border-white/10">
                <div className="w-16 h-16 rounded-2xl bg-white/5 mx-auto mb-4 flex items-center justify-center">
                  <Receipt className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-500 font-medium">No hay gastos registrados</p>
                <p className="text-sm text-gray-600 mt-1">Escanea tu primer recibo para comenzar</p>
              </div>
            )}
          </div>
        </section>
      </motion.div>
    </div>
  );
}