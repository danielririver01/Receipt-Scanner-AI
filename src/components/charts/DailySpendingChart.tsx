'use client';

import { motion } from 'framer-motion';

interface DayData {
  day: number;
  total: number;
}

interface DailySpendingChartProps {
  data: DayData[];
  month: number;
  year: number;
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function DailySpendingChart({ data, month, year }: DailySpendingChartProps) {
  const hasData = data.some(d => d.total > 0);
  const maxVal = Math.max(...data.map(d => d.total), 1);
  const totalMonth = data.reduce((acc, d) => acc + d.total, 0);

  if (!hasData) return null;

  const daysInMonth = new Date(year, month, 0).getDate();
  const chartWidth = 100;
  const chartHeight = 80;

  const points = data.map((d, i) => {
    const x = (i / (daysInMonth - 1)) * chartWidth;
    const y = chartHeight - (d.total / maxVal) * (chartHeight - 10);
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <motion.div
      className="stat-card rounded-3xl p-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-violet-500" />
          Gasto Diario
        </h3>
        <div className="text-right">
          <span className="text-xs text-gray-600">{MONTH_NAMES[month - 1]} {year}</span>
          <p className="text-sm font-bold text-white">${(totalMonth / 1000).toFixed(0)}k total</p>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`-5 -5 ${chartWidth + 10} ${chartHeight + 20}`} className="w-full h-40" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(139, 92, 246, 0.3)" />
              <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75].map((pct, i) => (
            <line
              key={i}
              x1="0"
              y1={chartHeight * pct}
              x2={chartWidth}
              y2={chartHeight * pct}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="0.5"
            />
          ))}

          <motion.path
            d={areaPath}
            fill="url(#areaGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          />

          <motion.path
            d={linePath}
            fill="none"
            stroke="rgb(139, 92, 246)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.8, ease: [0.23, 1, 0.32, 1] }}
          />

          {points.filter((_, i) => i % Math.ceil(daysInMonth / 10) === 0 || i === daysInMonth - 1).map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="2"
              fill="rgb(139, 92, 246)"
              initial={{ r: 0 }}
              animate={{ r: p.total > 0 ? 2.5 : 0 }}
              transition={{ delay: 1.5 + i * 0.05 }}
            />
          ))}
        </svg>

        <div className="flex justify-between mt-2 px-1">
          {[1, Math.round(daysInMonth / 4), Math.round(daysInMonth / 2), Math.round(daysInMonth * 3 / 4), daysInMonth].map((d, i) => (
            <span key={i} className="text-[10px] text-gray-600">{d}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
