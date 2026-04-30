'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading?: boolean;
}

export default function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  loading = false
}: DeleteModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-[1001] p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-[#0e0e0e] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden pointer-events-auto"
            >
              {/* Header with Icon */}
              <div className="p-8 pb-0 text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 border border-red-500/20">
                  <AlertTriangle size={40} />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight mb-2 uppercase">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed px-4">
                  {message}
                </p>
              </div>

              {/* Actions */}
              <div className="p-8 flex flex-col gap-3">
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Confirmar Eliminación
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-4 rounded-2xl transition-all active:scale-95 text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
