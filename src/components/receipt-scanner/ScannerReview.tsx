'use client';

import { motion } from 'framer-motion';
import { Loader2, RefreshCcw, Send } from 'lucide-react';
import { Item } from '@/types';

interface ScannerReviewProps {
  result: {
    amount: number;
    merchant: string;
    date: string;
    category: string;
    imageUrl: string;
    items: Item[];
    itemsConfidence: number;
  };
  loading: boolean;
  onUpdateResult: (updates: Partial<ScannerReviewProps['result']>) => void;
  onSave: () => void;
  onReset: () => void;
}

export default function ScannerReview({
  result,
  loading,
  onUpdateResult,
  onSave,
  onReset
}: ScannerReviewProps) {
  const handleItemNameChange = (index: number, value: string) => {
    const newItems = [...result.items];
    newItems[index] = { ...newItems[index], name: value };
    onUpdateResult({ items: newItems });
  };

  const handleItemPriceChange = (index: number, value: number) => {
    const newItems = [...result.items];
    newItems[index] = { ...newItems[index], price: value };
    const newTotal = newItems.reduce((sum, i) => sum + i.price, 0);
    onUpdateResult({ items: newItems, amount: newTotal });
  };

  const itemsTotal = result.items.reduce((sum, i) => sum + i.price, 0);
  const amountDiff = Math.abs(itemsTotal - result.amount);

  return (
    <motion.div 
      key="editing"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Revisión</h3>
          <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-1">Extracción completada</span>
        </div>
        <button onClick={onReset} className="p-2 bg-white/5 rounded-xl text-gray-500 hover:text-white transition-colors">
          <RefreshCcw size={18} />
        </button>
      </div>

      {result.imageUrl && (
        <div className="relative aspect-[3/4] w-full max-w-[200px] mx-auto rounded-2xl overflow-hidden border border-white/10">
          <img src={result.imageUrl} alt="Receipt" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Establecimiento</label>
            <input
              type="text"
              value={result.merchant}
              onChange={(e) => onUpdateResult({ merchant: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-white/5 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-orange-500/50 transition-all focus:bg-black"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Monto Total</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500 font-black">$</span>
              <input
                type="number"
                value={result.amount}
                onChange={(e) => onUpdateResult({ amount: parseFloat(e.target.value) || 0 })}
                className="w-full bg-[#1a1a1a] border border-white/5 rounded-2xl pl-10 pr-5 py-4 text-white font-black text-xl focus:outline-none focus:border-orange-500/50 transition-all focus:bg-black [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Categoría Inteligente</label>
            <input
              type="text"
              value={result.category}
              onChange={(e) => onUpdateResult({ category: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-white/5 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-orange-500/50 transition-all focus:bg-black"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Fecha de Emisión</label>
            <input
              type="date"
              value={result.date?.split('T')[0]}
              onChange={(e) => onUpdateResult({ date: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-white/5 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-orange-500/50 transition-all focus:bg-black [color-scheme:dark]"
            />
          </div>
        </div>

        {result.items && result.items.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Productos Extraídos ({result.items.length})</span>
              {result.itemsConfidence < 0.8 && (
                <span className="text-[10px] text-orange-500 font-bold">⚠️ Revisar suma</span>
              )}
            </div>
            <div className="bg-white/5 rounded-2xl p-4 space-y-2 max-h-48 overflow-y-auto">
              {result.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleItemNameChange(idx, e.target.value)}
                    className="flex-1 bg-transparent border-none text-white text-sm font-medium focus:outline-none placeholder:text-gray-600"
                    placeholder="Producto"
                  />
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => handleItemPriceChange(idx, parseFloat(e.target.value) || 0)}
                    className="w-24 bg-white/10 rounded-lg px-2 py-1 text-white text-sm font-bold text-right focus:outline-none focus:border-orange-500/50 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                  />
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/5">
                <span className="text-gray-500 text-sm">Suma:</span>
                <span className={`font-bold ${amountDiff > 100 ? 'text-orange-500' : 'text-white'}`}>
                  ${itemsTotal.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onSave}
        disabled={loading}
        className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:from-orange-500 hover:to-orange-400 transition-all shadow-xl shadow-orange-600/20 active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.15em] text-xs"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={16} />}
        Confirmar y Guardar Registro
      </button>
    </motion.div>
  );
}
