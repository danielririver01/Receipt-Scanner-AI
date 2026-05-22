'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Wallet, Receipt, TrendingUp, Sparkles, ArrowRight, TrendingDown } from 'lucide-react';
import ReceiptScanner from '@/components/ReceiptScanner';
import ChartsSection from '@/components/ChartsSection';
import { Suspense } from 'react';
import { Expense, Budget } from '@/types';
import StatCard from './dashboard/StatCard';
import RecentExpensesList from './dashboard/RecentExpensesList';

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
        <StatCard
          icon={Wallet}
          iconColor="text-orange-500"
          iconBgFrom="from-orange-500/20"
          iconBgTo="orange-600/10"
          glowColor="from-orange-500/10 to-transparent"
          badge="Total Acumulado"
          badgeVariant="orange"
          title="Total Gastado"
          value={`$${totalSpent.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          subtitle="COP"
        >
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
        </StatCard>

        <StatCard
          icon={TrendingUp}
          iconColor="text-blue-500"
          iconBgFrom="from-blue-500/20"
          iconBgTo="blue-600/10"
          glowColor="from-blue-500/10 to-transparent"
          badge={isOverBudget ? 'Sobre presupuesto' : 'En presupuesto'}
          badgeVariant={isOverBudget ? 'ruby' : 'emerald'}
          title="Presupuesto Mensual"
          value={`$${totalBudget.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          subtitle={remaining >= 0
            ? `${remaining.toLocaleString('es-CO')} restante`
            : `${Math.abs(remaining).toLocaleString('es-CO')} sobre presupuesto`
          }
        />

        <StatCard
          icon={Receipt}
          iconColor="text-violet-500"
          iconBgFrom="from-violet-500/20"
          iconBgTo="violet-600/10"
          glowColor="from-violet-500/10 to-transparent"
          badge="Historial"
          badgeVariant="emerald"
          title="Gastos Registrados"
          value={String(totalExpensesCount)}
          subtitle="registros"
          colSpan="md:col-span-2 lg:col-span-1"
        >
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span>Seguimiento activo</span>
          </div>
        </StatCard>
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

          <RecentExpensesList expenses={recentExpenses} />
        </section>
      </motion.div>
    </div>
  );
}
