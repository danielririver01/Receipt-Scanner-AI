'use client';

import { useState } from 'react';
import FindingsCard from '@/components/FindingsCard';
import ProductHistoryModal from '@/components/ProductHistoryModal';
import { PurchaseFindingsResult, ProductHistory } from '@/types';

const SAMPLE_FINDINGS: PurchaseFindingsResult = {
  findings: [
    {
      type: 'unusual',
      productName: 'Aceite',
      currentPrice: 11200,
      headline: 'Aceite cuesta 26% más',
      detail: 'Hoy pagaste $2.300 más que tu precio habitual.',
      impact: 2300,
    },
    {
      type: 'provider',
      productName: 'Leche',
      currentPrice: 5200,
      headline: 'Carulla sigue siendo el más económico',
      detail: 'Para Leche sale ~$400 más barato que en Jumbo.',
      impact: 400,
    },
    {
      type: 'trend',
      productName: 'Tomate',
      currentPrice: 3400,
      headline: 'Tomate acumula 3 aumentos seguidos',
      detail: 'Viene subiendo compra tras compra.',
      impact: 900,
    },
  ],
  totalOvercost: 3200,
  hasHistory: true,
};

const SAMPLE_HISTORY: ProductHistory = {
  productName: 'Aceite',
  series: [
    { date: '2026-03-01', price: 8900 },
    { date: '2026-04-01', price: 9100 },
    { date: '2026-05-01', price: 9800 },
    { date: '2026-06-01', price: 10600 },
    { date: '2026-07-01', price: 11200 },
  ],
  avg: 9920,
  min: 8900,
  max: 11200,
  count: 5,
  lastPrice: 11200,
  lastDate: '2026-07-01',
  firstDate: '2026-03-01',
  trendNote: 'Viene subiendo en tus últimas 3 compras.',
  normBase: '100ml',
  merchants: [
    { merchant: 'Carulla', avg: 9900, count: 3 },
    { merchant: 'Jumbo', avg: 10400, count: 2 },
  ],
};

export default function PreviewPage() {
  const [openHistory, setOpenHistory] = useState(false);

  if (process.env.NODE_ENV === 'production') {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <p className="text-sm text-gray-500">Preview disponible solo en desarrollo.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10 max-w-2xl mx-auto space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight">Preview — Escanear tus compras</h1>
        <p className="text-xs text-gray-500">
          Render de los componentes reales con datos de ejemplo. Esto es exactamente lo que el usuario ve
          tras escanear (cuando ya hay historial).
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
          1 · 🧠 Lo que detecté (hallazgos del escaneo)
        </h2>
        <FindingsCard result={SAMPLE_FINDINGS} />
      </section>

      <section className="space-y-2">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
          2 · Historial de producto (modal al tocar 📈)
        </h2>
        <button
          onClick={() => setOpenHistory(true)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-left text-sm text-gray-300 hover:bg-white/10 transition-colors"
        >
          Toca para abrir el historial de <span className="text-white font-bold">Aceite</span> →
        </button>
      </section>

      {openHistory && (
        <ProductHistoryModal productName="Aceite" onClose={() => setOpenHistory(false)} previewData={SAMPLE_HISTORY} />
      )}
    </main>
  );
}
