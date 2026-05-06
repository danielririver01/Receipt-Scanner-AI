'use client';

import CategoryDonutChart from './charts/CategoryDonutChart';
import MonthlyTrendChart from './charts/MonthlyTrendChart';
import DailySpendingChart from './charts/DailySpendingChart';

interface Expense {
  id: string;
  description: string;
  date: Date;
  amount: number;
  category: { name: string };
}

interface ChartsSectionProps {
  expenses: Expense[];
  monthlyExpenses: Expense[];
  month: number;
  year: number;
}

const COLORS = [
  '#f97316', '#3b82f6', '#8b5cf6', '#10b981', '#f43f5e',
  '#eab308', '#06b6d4', '#ec4899', '#14b8a6', '#a855f7',
];

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function getCategoryData(expenses: Expense[]) {
  const map = new Map<string, number>();
  for (const e of expenses) {
    const name = e.category?.name || 'Sin categoría';
    map.set(name, (map.get(name) || 0) + e.amount);
  }
  return Array.from(map.entries())
    .map(([name, total], i) => ({ name, total, color: COLORS[i % COLORS.length] }))
    .sort((a, b) => b.total - a.total);
}

function getMonthlyData(expenses: Expense[], currentMonth: number, currentYear: number) {
  const months: { label: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    let m = currentMonth - i;
    let y = currentYear;
    if (m <= 0) { m += 12; y--; }
    const monthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === m && d.getFullYear() === y;
    });
    const total = monthExpenses.reduce((acc, e) => acc + e.amount, 0);
    months.push({ label: MONTH_NAMES[m - 1], total });
  }
  return months;
}

function getDailyData(expenses: Expense[], month: number, year: number) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const daily: { day: number; total: number }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dayExpenses = expenses.filter(e => {
      const date = new Date(e.date);
      return date.getDate() === d && date.getMonth() + 1 === month && date.getFullYear() === year;
    });
    const total = dayExpenses.reduce((acc, e) => acc + e.amount, 0);
    daily.push({ day: d, total });
  }
  return daily;
}

export default function ChartsSection({ expenses, monthlyExpenses, month, year }: ChartsSectionProps) {
  const categoryData = getCategoryData(expenses);
  const monthlyData = getMonthlyData(monthlyExpenses, month, year);
  const dailyData = getDailyData(expenses, month, year);

  const hasCategories = categoryData.length > 0;
  const hasMonthly = monthlyData.some(m => m.total > 0);
  const hasDaily = dailyData.some(d => d.total > 0);

  if (!hasCategories && !hasMonthly && !hasDaily) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hasCategories && (
          <CategoryDonutChart data={categoryData} />
        )}
        {hasMonthly && (
          <MonthlyTrendChart data={monthlyData} />
        )}
      </div>
      {hasDaily && (
        <DailySpendingChart data={dailyData} month={month} year={year} />
      )}
    </div>
  );
}
