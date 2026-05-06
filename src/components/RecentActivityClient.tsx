'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Receipt, Search, Filter, Calendar, ChevronRight, Sparkles, Edit3, Package } from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import EditExpenseModal from './EditExpenseModal';

interface Expense {
  id: string;
  description: string;
  date: Date;
  amount: number;
  amountConfidence: number | null;
  itemsConfidence: number | null;
  category: { name: string; id?: string };
  receiptUrl?: string | null;
  ocrText?: string;
  items?: string | null;
}

interface RecentActivityClientProps {
  expenses: Expense[];
  totalCount: number;
  refreshKey?: number;
}

const ITEMS_PER_PAGE = 12;

export default function RecentActivityClient({ expenses, totalCount, refreshKey = 0 }: RecentActivityClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(expenses.map(e => e.category.name));
    return ['all', ...Array.from(cats)];
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || expense.category.name === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchQuery, selectedCategory]);

  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCardClick = useCallback((expense: Expense) => {
    setSelectedExpense(expense);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedExpense(null), 300);
  }, []);

  const handleUpdated = useCallback(() => {
    router.refresh();
    handleModalClose();
  }, [router, handleModalClose]);

  const handleDeleted = useCallback(() => {
    router.refresh();
    handleModalClose();
  }, [router, handleModalClose]);

  return (
    <div className="min-h-screen pb-20">
      <motion.header
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="px-4 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-black tracking-tight">
              <span className="accent-text">Actividad</span> Reciente
            </h1>
            <p className="text-xs text-gray-500">{totalCount} registros en total</p>
          </div>
        </div>
      </motion.header>

      <div className="px-4 py-6 space-y-6">
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por establecimiento o categoría..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500/50 transition-all"
          />
        </motion.div>

        <motion.div
          className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Filter className="w-4 h-4 text-gray-500 shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {cat === 'all' ? 'Todos' : cat}
            </button>
          ))}
        </motion.div>

        {filteredExpenses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedExpenses.map((expense, index) => (
                <motion.div
                  key={`${expense.id}-${refreshKey}`}
                  className="obsidian-card rounded-3xl p-5 group cursor-pointer relative"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  onClick={() => handleCardClick(expense)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(expense);
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
                      {format(new Date(expense.date), "dd 'de' MMMM, yyyy", { locale: es })}
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
              ))}
            </div>

            {totalPages > 1 && (
              <motion.div
                className="flex items-center justify-center gap-2 py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    const isNearCurrent = Math.abs(page - currentPage) <= 1;
                    const isFirst = page === 1;
                    const isLast = page === totalPages;

                    if (!isNearCurrent && !isFirst && !isLast) {
                      if (page === 2 || page === totalPages - 1) {
                        return (
                          <span key={page} className="px-2 text-gray-500">...</span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                          currentPage === page
                            ? 'bg-orange-500 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </button>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div
            className="obsidian-card rounded-3xl p-12 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 mx-auto mb-4 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-400 font-bold">No se encontraron registros</p>
            <p className="text-sm text-gray-600 mt-1">Intenta con otros términos de búsqueda</p>
          </motion.div>
        )}
      </div>

      <EditExpenseModal
        expense={selectedExpense}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </div>
  );
}