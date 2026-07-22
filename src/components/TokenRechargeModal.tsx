'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Package, Rocket, Sparkles, CreditCard, Loader2 } from 'lucide-react';

export type RechargeModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function TokenRechargeModal({ isOpen, onClose }: RechargeModalProps) {
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // El modal se monta en document.body vía portal para escapar cualquier
  // stacking context de los ancestros (backdrop-blur / transform de framer-motion)
  // que dejaba el modal "por detrás" del contenido del dashboard.
  useEffect(() => setMounted(true), []);

  const handleRecharge = async (packId: string) => {
    setLoadingPack(packId);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pack: packId })
      });

      const data = await response.json();

      if (data.checkout_url) {
        window.open(data.checkout_url, '_blank');
      } else {
        setError(data.error || 'Hubo un error al generar el pago. Intenta de nuevo.');
      }
    } catch (error) {
      setError('Error de conexión al procesar el pago.');
    } finally {
      setLoadingPack(null);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" style={{ zIndex: 2147483647 }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden font-sans"
          >
            {/* Header Section */}
            <div className="p-8 pb-6 text-center space-y-4">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/5"
              >
                <X size={20} />
              </button>

              <div className="w-16 h-16 bg-[#1a1a1a] rounded-2xl mx-auto flex items-center justify-center border border-white/5 shadow-inner">
                <Zap className="text-orange-500 w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Recargar créditos IA</h2>
                <p className="text-sm text-gray-400 mt-2">Potencia tu registro de gastos con más análisis instantáneos.</p>
              </div>
            </div>

            {/* Packs Section */}
            <div className="px-6 space-y-4">
              {/* Pack 25 */}
              <button
                onClick={() => handleRecharge('25')}
                disabled={loadingPack !== null}
                className="w-full relative group text-left flex items-center justify-between p-5 rounded-2xl bg-[#111111] border border-white/5 hover:border-orange-500/30 transition-all hover:bg-[#151515] active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-orange-500/10 transition-colors">
                    <Package className="text-gray-400 group-hover:text-orange-500" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Pack Inicial</h3>
                    <span className="text-orange-500 text-sm font-semibold tracking-wide">+25 créditos IA</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-white">$5.000</div>
                  <div className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">COP</div>
                </div>
                {loadingPack === '25' && (
                  <div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                    <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                  </div>
                )}
              </button>

              {/* Pack 50 (Popular) */}
              <button
                onClick={() => handleRecharge('50')}
                disabled={loadingPack !== null}
                className="w-full relative group text-left flex items-center justify-between p-5 rounded-2xl bg-[#111111] border border-white/5 hover:border-indigo-500/30 transition-all hover:bg-[#151515] active:scale-[0.98]"
              >
                <div className="absolute -top-3 right-4 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-indigo-500/20">
                  Más popular
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
                    <Rocket className="text-gray-400 group-hover:text-indigo-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Pack Popular</h3>
                    <span className="text-indigo-400 text-sm font-semibold tracking-wide">+50 créditos IA</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-white">$9.000</div>
                  <div className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">COP</div>
                </div>
                 {loadingPack === '50' && (
                  <div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                  </div>
                )}
              </button>

              {/* Pack 100 (Mejor valor) */}
              <button
                onClick={() => handleRecharge('100')}
                disabled={loadingPack !== null}
                className="w-full relative group text-left flex items-center justify-between p-5 rounded-2xl bg-[#111111] border border-white/5 hover:border-emerald-500/30 transition-all hover:bg-[#151515] active:scale-[0.98]"
              >
                <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-emerald-500/20">
                  Mejor valor
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                    <Sparkles className="text-gray-400 group-hover:text-emerald-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Pack Pro</h3>
                    <span className="text-emerald-400 text-sm font-semibold tracking-wide">+100 créditos IA</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-white">$16.000</div>
                  <div className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">COP</div>
                </div>
                 {loadingPack === '100' && (
                  <div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                  </div>
                )}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="px-6 pt-4">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                  <span className="text-red-400 text-sm leading-relaxed">{error}</span>
                </div>
              </div>
            )}

            {/* Footer Section */}
            <div className="p-6 pt-8 space-y-6">
              <div className="flex flex-col items-center justify-center gap-2">
                <p className="text-xs text-gray-500 text-center max-w-[260px] leading-relaxed">
                  Los créditos extra se acumulan y no expiran. El pago se procesa de forma segura a través de <span className="font-bold text-gray-300">Mercado Pago</span>.
                </p>
                <CreditCard size={16} className="text-gray-600 mt-1" />
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 rounded-xl border border-white/10 text-gray-400 font-bold hover:bg-white/5 hover:text-white transition-all text-sm"
              >
                Cerrar ahora
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
