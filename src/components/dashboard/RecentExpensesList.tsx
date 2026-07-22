'use client';

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Receipt } from 'lucide-react';
import { Expense } from '@/types';

interface RecentExpensesListProps {
  expenses: Expense[];
}

export default function RecentExpensesList({ expenses }: RecentExpensesListProps) {
  if (expenses.length === 0) {
    return (
      <div className="obsidian-card rounded-2xl p-10 text-center border-dashed border-white/10">
        <div className="w-16 h-16 rounded-2xl bg-white/5 mx-auto mb-4 flex items-center justify-center">
          <Receipt className="w-8 h-8 text-gray-600" />
        </div>
        <p className="text-gray-500 font-medium">No hay gastos registrados</p>
        <p className="text-sm text-gray-600 mt-1">Escanea tu primer recibo para comenzar</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense, index) => (
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
              {format(new Date(new Date(expense.date).getUTCFullYear(), new Date(expense.date).getUTCMonth(), new Date(expense.date).getUTCDate()), "dd MMM", { locale: es })} • {expense.category.name}
            </p>
          </div>
          <div className="text-right">
            <p className="font-black text-white">${expense.amount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
