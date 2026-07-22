'use client';

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Receipt, Calendar, Edit3, ChevronRight } from 'lucide-react';

import { Expense } from '@/types';

interface ExpenseCardProps {
  expense: Expense;
  index: number;
  refreshKey: number;
  onClick: (expense: Expense) => void;
}

export default function ExpenseCard({ expense, index, refreshKey, onClick }: ExpenseCardProps) {
  return (
    <motion.div
      key={`${expense.id}-${refreshKey}`}
      className="obsidian-card rounded-3xl p-5 group cursor-pointer relative"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      onClick={() => onClick(expense)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick(expense);
        }}
        className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-orange-500 hover:border-orange-500/30 transition-all opacity-0 group-hover:opacity-100"
      >
        <Edit3 className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/15 to-orange-600/5 flex items-center justify-center border border-orange-500/20 group-hover:border-orange-500/40 transition-colors">
          <Receipt className="w-5 h-5 text-orange-500" />
        </div>
        <span className="badge badge-emerald">Registrado</span>
      </div>

      <div className="space-y-2">
        <p className="font-black text-white uppercase tracking-tight text-sm leading-tight pr-8">
          {expense.description}
        </p>
        <p className="text-xs text-gray-500 flex items-center gap-1.5">
          <Calendar className="w-3 h-3" />
          {format(new Date(new Date(expense.date).getUTCFullYear(), new Date(expense.date).getUTCMonth(), new Date(expense.date).getUTCDate()), "dd 'de' MMMM, yyyy", { locale: es })}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-orange-500 font-medium">{expense.category.name}</p>
          {expense.items && (() => {
            try {
              const items = JSON.parse(expense.items);
              if (Array.isArray(items) && items.length > 0) {
                return (
                  <span className="badge badge-sapphire text-[10px]">
                    {items.length} producto{items.length !== 1 ? 's' : ''}
                  </span>
                );
              }
            } catch {}
            return null;
          })()}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-2xl font-black text-white">
          ${expense.amount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </span>
        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-orange-500 transition-colors" />
      </div>
    </motion.div>
  );
}
