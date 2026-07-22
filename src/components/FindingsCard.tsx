'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, Store } from 'lucide-react';
import { PurchaseFindingsResult } from '@/types';

const ICONS = {
  unusual: AlertTriangle,
  trend: TrendingUp,
  best: PiggyBank,
  drop: TrendingDown,
  provider: Store,
};

const ACCENT = {
  unusual: 'text-amber-400 bg-amber-500/10',
  trend: 'text-red-400 bg-red-500/10',
  best: 'text-emerald-400 bg-emerald-500/10',
  drop: 'text-emerald-400 bg-emerald-500/10',
  provider: 'text-teal-400 bg-teal-500/10',
};

export default function FindingsCard({ result }: { result: PurchaseFindingsResult | null | undefined }) {
  if (!result) return null;
  const { findings, totalOvercost, hasHistory } = result;

  if (findings.length === 0 && totalOvercost <= 0) {
    if (!hasHistory) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-3"
      >
        <span className="text-xl">🧠</span>
        <p className="text-sm text-gray-400">Revisé la factura — sin cambios de precio inusuales esta vez.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 border border-violet-500/10 rounded-2xl p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">🧠</span>
        <div>
          <span className="text-[11px] font-black text-violet-300 uppercase tracking-widest">Lo que detecté</span>
          <p className="text-[10px] text-gray-500 mt-0.5">Hallazgos de esta compra</p>
        </div>
      </div>

      <div className="space-y-2">
        {findings.map((f, i) => {
          const Icon = ICONS[f.type];
          const accent = ACCENT[f.type];
          return (
            <motion.div
              key={`${f.productName}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 bg-black/20 rounded-xl p-3"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white leading-tight">{f.headline}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{f.detail}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {totalOvercost > 0 && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/10 rounded-xl px-4 py-3">
          <ArrowUpRight size={16} className="text-red-400 shrink-0" />
          <p className="text-xs text-red-300">
            Los aumentos detectados representan{' '}
            <span className="font-black">${Math.round(totalOvercost).toLocaleString('es-CO')}</span> respecto a tus
            precios habituales.
          </p>
        </div>
      )}
    </motion.div>
  );
}
