'use client';

import { motion } from 'framer-motion';
import { Upload, Camera } from 'lucide-react';

interface ScannerIdleProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ScannerIdle({ fileInputRef, onChange }: ScannerIdleProps) {
  return (
    <motion.div 
      key="idle"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="text-center py-10 space-y-6"
    >
      <div className="relative w-24 h-24 mx-auto">
        <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full animate-pulse"></div>
        <div className="relative glass-container w-full h-full rounded-[2rem] flex items-center justify-center text-orange-500 shadow-2xl border-white/10">
          <Camera className="w-10 h-10" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-2xl font-black tracking-tight text-white uppercase">Registro de Gastos</h3>
        <p className="text-gray-500 text-xs max-w-[240px] mx-auto font-medium uppercase tracking-widest leading-relaxed">
          Extracción inteligente de datos con precisión milimétrica.
        </p>
      </div>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        id="receipt-upload"
        ref={fileInputRef}
        onChange={onChange}
      />
      <label
        htmlFor="receipt-upload"
        className="cursor-pointer inline-flex items-center justify-center w-full bg-white text-black font-black py-5 rounded-[1.5rem] transition-all hover:bg-orange-500 hover:text-white active:scale-95 shadow-xl shadow-white/5 uppercase tracking-widest text-xs"
      >
        <Upload className="w-4 h-4 mr-2" />
        Comenzar Captura
      </label>
    </motion.div>
  );
}
