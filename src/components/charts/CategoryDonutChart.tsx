'use client';

import { motion } from 'framer-motion';

interface CategoryData {
  name: string;
  total: number;
  color: string;
}

interface CategoryDonutChartProps {
  data: CategoryData[];
}

export default function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  const total = data.reduce((acc, d) => acc + d.total, 0);
  if (total === 0) return null;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  const segments = data.map((item) => {
    const percent = item.total / total;
    const offset = accumulated;
    accumulated += percent;
    return { ...item, percent, offset };
  });

  return (
    <motion.div
      className="stat-card rounded-3xl p-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-orange-500" />
        Gastos por Categoría
      </h3>

      <div className="flex items-center gap-8">
        <div className="relative flex-shrink-0">
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />
            {segments.map((seg, i) => {
              const dashLength = seg.percent * circumference;
              const dashOffset = -seg.offset * circumference + circumference * 0.25;
              return (
                <motion.circle
                  key={i}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="16"
                  strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  initial={{ strokeDasharray: `0 ${circumference}` }}
                  animate={{ strokeDasharray: `${dashLength} ${circumference - dashLength}` }}
                  transition={{ duration: 1, delay: 0.5 + i * 0.15, ease: [0.23, 1, 0.32, 1] }}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black">{data.length}</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">gastos</span>
          </div>
        </div>

        <div className="space-y-3 flex-1 min-w-0">
          {segments.slice(0, 5).map((seg, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-sm text-gray-400 truncate flex-1">{seg.name}</span>
              <span className="text-sm font-bold text-white">
                ${(seg.total / 1000).toFixed(0)}k
              </span>
              <span className="text-xs text-gray-600 w-10 text-right">{(seg.percent * 100).toFixed(0)}%</span>
            </motion.div>
          ))}
          {segments.length > 5 && (
            <p className="text-xs text-gray-600 pl-5">+{segments.length - 5} más</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
