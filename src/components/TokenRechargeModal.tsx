'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Package, Rocket, CreditCard, Loader2 } from 'lucide-react';

export type RechargeModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function TokenRechargeModal({ isOpen, onClose }: RechargeModalProps) {
  const [loadingPack, setLoadingPack] = useState<string | null>(null);

  const handleRecharge = async (packId: string) => {
    setLoadingPack(packId);
    
    try {
      const apiPack = packId === 'basic' ? '5k' : '10k';
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pack: apiPack })
      });
      
      const data = await response.json();
      
      if (data.checkout_url) {
        window.open(data.checkout_url, '_blank');
      } else {
        console.error('No se recibió checkout_url', data);
        alert('Hubo un error al generar el pago. Intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error procesando checkout:', error);
      alert('Error de conexión al procesar el pago.');
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
                <h2 className="text-2xl font-bold text-white tracking-tight">Recargar Tokens IA</h2>
                <p className="text-sm text-gray-400 mt-2">Potencia tu Scanner IA con más análisis instantáneos.</p>
              </div>
            </div>

            {/* Packs Section */}
            <div className="px-6 space-y-4">
              {/* Basic Pack */}
              <button
                onClick={() => handleRecharge('basic')}
                disabled={loadingPack !== null}
                className="w-full relative group text-left flex items-center justify-between p-5 rounded-2xl bg-[#111111] border border-white/5 hover:border-orange-500/30 transition-all hover:bg-[#151515] active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-orange-500/10 transition-colors">
                    <Package className="text-gray-400 group-hover:text-orange-500" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Pack Básico</h3>
                    <span className="text-orange-500 text-sm font-semibold tracking-wide">+15 Tokens</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-white">$5.000</div>
                  <div className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">COP</div>
                </div>
                {loadingPack === 'basic' && (
                  <div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                    <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                  </div>
                )}
              </button>

              {/* Pro Pack */}
              <button
                onClick={() => handleRecharge('pro')}
                disabled={loadingPack !== null}
                className="w-full relative group text-left flex items-center justify-between p-5 rounded-2xl bg-[#111111] border border-white/5 hover:border-indigo-500/30 transition-all hover:bg-[#151515] active:scale-[0.98]"
              >
                <div className="absolute -top-3 right-4 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-indigo-500/20">
                  Popular
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors">
                    <Rocket className="text-gray-400 group-hover:text-indigo-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Pack Pro</h3>
                    <span className="text-indigo-400 text-sm font-semibold tracking-wide">+35 Tokens</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-white">$10.000</div>
                  <div className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">COP</div>
                </div>
                 {loadingPack === 'pro' && (
                  <div className="absolute inset-0 bg-[#111111]/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                  </div>
                )}
              </button>
            </div>

            {/* Footer Section */}
            <div className="p-6 pt-8 space-y-6">
              <div className="flex flex-col items-center justify-center gap-2">
                <p className="text-xs text-gray-500 text-center max-w-[260px] leading-relaxed">
                  Los tokens extra se acumulan y no expiran. El pago se procesa de forma segura a través de <span className="font-bold text-gray-300">Mercado Pago</span>.
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
    </AnimatePresence>
  );
}
