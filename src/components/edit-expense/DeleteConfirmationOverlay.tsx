'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteConfirmationOverlayProps {
  isOpen: boolean;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmationOverlay({
  isOpen,
  loading,
  onCancel,
  onConfirm
}: DeleteConfirmationOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute inset-0 rounded-3xl bg-black/90 flex flex-col items-center justify-center p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <Trash2 className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-black text-white mb-2">¿Eliminar gasto?</h3>
          <p className="text-gray-400 text-sm text-center mb-6">
            Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 px-5 py-3 rounded-2xl bg-white/5 text-gray-400 font-bold text-sm hover:bg-white/10 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-5 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Eliminar'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
