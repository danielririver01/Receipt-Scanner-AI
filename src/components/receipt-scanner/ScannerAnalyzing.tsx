'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface ScannerAnalyzingProps {
  analysisStatus: string;
}

export default function ScannerAnalyzing({ analysisStatus }: ScannerAnalyzingProps) {
  return (
    <motion.div 
      key="scanning"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="py-16 text-center space-y-8"
    >
      <div className="relative w-32 h-32 mx-auto">
        <div className="absolute inset-0 border-4 border-orange-500/30 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-4 border-2 border-white/10 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="text-orange-500 w-10 h-10 animate-bounce" />
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2">
          <div className="h-1 w-1 bg-orange-500 rounded-full animate-ping"></div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Analizando Factura</h3>
        </div>
        <p className="text-orange-500 text-[11px] font-black uppercase tracking-[0.2em] animate-pulse">
          {analysisStatus}
        </p>
      </div>

      <div className="w-full max-w-[200px] mx-auto bg-white/5 h-1.5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 8 }}
          className="bg-orange-500 h-full"
        ></motion.div>
      </div>
    </motion.div>
  );
}
