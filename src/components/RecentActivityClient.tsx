'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import { Expense } from '@/types';
import EditExpenseModal from './EditExpenseModal';
import ExpenseCard from './recent-activity/ExpenseCard';
import Pagination from './recent-activity/Pagination';
import SearchAndFilterBar from './recent-activity/SearchAndFilterBar';

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
        <SearchAndFilterBar
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          categories={categories}
          onSearchChange={(value) => {
            setSearchQuery(value);
            setCurrentPage(1);
          }}
          onCategoryChange={(category) => {
            setSelectedCategory(category);
            setCurrentPage(1);
          }}
        />

        {filteredExpenses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedExpenses.map((expense, index) => (
                <ExpenseCard
                  key={`${expense.id}-${refreshKey}`}
                  expense={expense}
                  index={index}
                  refreshKey={refreshKey}
                  onClick={handleCardClick}
                />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
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
