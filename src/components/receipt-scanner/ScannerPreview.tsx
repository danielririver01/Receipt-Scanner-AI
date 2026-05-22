'use client';

import { motion } from 'framer-motion';
import { AlertCircle, X, Sparkles } from 'lucide-react';

interface ScannerPreviewProps {
  previewUrl: string | null;
  onReset: () => void;
  onAnalyze: () => void;
}

export default function ScannerPreview({ previewUrl, onReset, onAnalyze }: ScannerPreviewProps) {
  return (
    <motion.div 
      key="preview"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6"
    >
      <div className="relative aspect-[3/4] w-full max-w-[300px] mx-auto rounded-[2rem] overflow-hidden border-2 border-white/10 shadow-2xl">
        {previewUrl && <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        <button 
          onClick={onReset}
          className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-red-500 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-2xl flex gap-3 items-start">
        <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={18} />
        <div className="space-y-1">
          <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Validación de Calidad</h4>
          <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
            Asegúrate de que el ticket no esté borroso y la luz sea adecuada para evitar gastos innecesarios de tokens.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={onReset}
          className="bg-white/5 text-gray-400 font-bold py-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-all uppercase tracking-widest text-[10px]"
        >
          Repetir Foto
        </button>
        <button 
          onClick={onAnalyze}
          className="bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all active:scale-95 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
        >
          <Sparkles size={14} />
          Analizar
        </button>
      </div>
    </motion.div>
  );
}
