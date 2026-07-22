'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, History, TrendingUp, TrendingDown } from 'lucide-react';
import { getProductHistory } from '@/actions/priceHistory';
import { ProductHistory } from '@/types';

function PriceSparkline({ series }: { series: { date: string; price: number }[] }) {
  if (series.length < 2) return null;

  const w = 100;
  const h = 50;
  const prices = series.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const points = series.map((p, i) => {
    const x = (i / (series.length - 1)) * w;
    const y = h - ((p.price - min) / range) * (h - 8) - 4;
    return { x, y };
  });

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L ${w} ${h} L 0 ${h} Z`;
  const last = points[points.length - 1];
  const rising = prices[prices.length - 1] >= prices[0];
  const stroke = rising ? 'rgb(248,113,113)' : 'rgb(52,211,153)';

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={rising ? 'rgba(248,113,113,0.25)' : 'rgba(52,211,153,0.25)'} />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkGrad)" />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last.x} cy={last.y} r="2.5" fill={stroke} />
    </svg>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-black/20 rounded-xl px-3 py-2.5 text-center">
      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{label}</p>
      <p className="text-sm font-black text-white mt-0.5">{value}</p>
    </div>
  );
}

export default function ProductHistoryModal({
  productName,
  onClose,
  previewData,
}: {
  productName: string;
  onClose: () => void;
  previewData?: ProductHistory;
}) {
  const [data, setData] = useState<ProductHistory | null>(previewData ?? null);
  const [loading, setLoading] = useState(!previewData);

  useEffect(() => {
    if (previewData) {
      setData(previewData);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    getProductHistory(productName)
      .then((res) => {
        if (active) setData(res);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [productName, previewData]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#161616] border border-white/10 rounded-3xl p-6 space-y-5"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <History size={16} className="text-violet-300" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white leading-tight">{productName}</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Historial de precio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 rounded-xl text-gray-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <span className="text-xs text-gray-500 animate-pulse">Cargando historial…</span>
          </div>
        ) : !data ? (
          <div className="h-40 flex items-center justify-center text-center">
            <p className="text-xs text-gray-500 max-w-[220px]">
              Aún no tengo historial de este producto. Aparecerá aquí tras tus próximas compras.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-black/20 rounded-2xl p-4">
              <PriceSparkline series={data.series} />
              <div className="flex justify-between mt-2 px-1">
                <span className="text-[10px] text-gray-600">{data.firstDate}</span>
                <span className="text-[10px] text-gray-600">{data.lastDate}</span>
              </div>
            </div>

            {data.trendNote && (
              <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2.5">
                {data.trendNote.includes('subiendo') || data.trendNote.includes('Subió') ? (
                  <TrendingUp size={15} className="text-red-400 shrink-0" />
                ) : (
                  <TrendingDown size={15} className="text-emerald-400 shrink-0" />
                )}
                <p className="text-[11px] text-gray-300">{data.trendNote}</p>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              <StatChip
                label={data.normBase ? `Habitual (${data.normBase})` : 'Habitual'}
                value={`$${data.avg.toLocaleString('es-CO')}`}
              />
              <StatChip label="Mínimo" value={`$${data.min.toLocaleString('es-CO')}`} />
              <StatChip label="Máximo" value={`$${data.max.toLocaleString('es-CO')}`} />
              <StatChip label="Veces" value={`${data.count}`} />
            </div>

            {data.merchants.length >= 2 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                  Por proveedor
                </p>
                {data.merchants.map((m, i) => {
                  const pct = Math.min(100, Math.round((m.avg / data.merchants[data.merchants.length - 1].avg) * 100));
                  const cheapest = i === 0;
                  return (
                    <div key={m.merchant} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          {cheapest && <span className="text-teal-400">🟢</span>}
                          {m.merchant}
                          {cheapest && (
                            <span className="text-[9px] text-teal-400 font-black uppercase tracking-wider">más económico</span>
                          )}
                        </span>
                        <span className={`text-xs font-black ${cheapest ? 'text-teal-400' : 'text-gray-400'}`}>
                          ${m.avg.toLocaleString('es-CO')}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${cheapest ? 'bg-teal-400' : 'bg-white/20'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-[10px] text-gray-600 text-center">
              Última compra: ${data.lastPrice?.toLocaleString('es-CO')} · {data.lastDate}
            </p>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
