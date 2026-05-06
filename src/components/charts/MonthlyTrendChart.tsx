'use client';

import { motion } from 'framer-motion';

interface MonthData {
  label: string;
  total: number;
}

interface MonthlyTrendChartProps {
  data: MonthData[];
}

export default function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const maxVal = Math.max(...data.map(d => d.total), 1);
  const hasData = data.some(d => d.total > 0);

  if (!hasData) return null;

  return (
    <motion.div
      className="stat-card rounded-3xl p-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          Tendencia Mensual
        </h3>
        <span className="text-xs text-gray-600">Últimos 6 meses</span>
      </div>

      <div className="flex items-end gap-3 h-40">
        {data.map((item, i) => {
          const height = maxVal > 0 ? (item.total / maxVal) * 100 : 0;
          const isHighest = item.total === maxVal && item.total > 0;

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center">
                {item.total > 0 && (
                  <motion.span
                    className="text-[10px] text-gray-500 font-medium mb-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 + i * 0.1 }}
                  >
                    ${(item.total / 1000).toFixed(0)}k
                  </motion.span>
                )}
                <div className="w-full h-32 flex items-end">
                  <motion.div
                    className="w-full rounded-t-xl relative overflow-hidden"
                    style={{
                      background: isHighest
                        ? 'linear-gradient(180deg, #f97316, #ea580c)'
                        : 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))'
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(height, 4)}%` }}
                    transition={{ duration: 0.8, delay: 0.6 + i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                  >
                    {isHighest && (
                      <div className="absolute inset-0 bg-gradient-to-t from-orange-600/50 to-transparent" />
                    )}
                  </motion.div>
                </div>
              </div>
              <span className="text-[11px] text-gray-500 font-medium">{item.label}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
