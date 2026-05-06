'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, setMonth, setYear } from 'date-fns';
import { es } from 'date-fns/locale';

interface MonthSelectorProps {
  currentMonth: number;
  currentYear: number;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function MonthSelector({ currentMonth, currentYear }: MonthSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const navigateMonth = (direction: number) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    updateUrl(newMonth, newYear);
  };

  const updateUrl = (month: number, year: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', month.toString());
    params.set('year', year.toString());
    router.push(`/dashboard?${params.toString()}`);
    setShowCalendar(false);
  };

  const selectMonth = (monthIndex: number) => {
    updateUrl(monthIndex + 1, selectedYear);
  };

  const changeYear = (delta: number) => {
    setSelectedYear(prev => prev + delta);
  };

  const displayDate = new Date(currentYear, currentMonth - 1, 1);

  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={() => navigateMonth(-1)}
        className="p-1 hover:text-orange-500 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        onClick={() => setShowCalendar(!showCalendar)}
        className="flex items-center gap-2 hover:text-orange-500 transition-colors"
      >
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-medium min-w-[120px] text-center">
          {format(displayDate, "MMMM yyyy", { locale: es })}
        </span>
      </button>

      <button
        onClick={() => navigateMonth(1)}
        className="p-1 hover:text-orange-500 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {showCalendar && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 obsidian-card rounded-2xl p-4 z-50 min-w-[280px]">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => changeYear(-1)}
              className="p-1 hover:text-orange-500 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-white">{selectedYear}</span>
            <button
              onClick={() => changeYear(1)}
              className="p-1 hover:text-orange-500 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((month, index) => (
              <button
                key={month}
                onClick={() => selectMonth(index)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  currentMonth === index + 1 && currentYear === selectedYear
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {month.slice(0, 3)}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              const now = new Date();
              updateUrl(now.getMonth() + 1, now.getFullYear());
            }}
            className="w-full mt-3 py-2 text-sm text-orange-500 hover:bg-orange-500/10 rounded-xl transition-colors"
          >
            Ir a hoy
          </button>
        </div>
      )}

      {showCalendar && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowCalendar(false)}
        />
      )}
    </div>
  );
}
