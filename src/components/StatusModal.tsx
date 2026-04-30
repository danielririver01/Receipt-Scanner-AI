'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ModalType = 'error' | 'success' | 'info';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ModalType;
  title: string;
  message: string;
}

const typeConfig = {
  error: {
    icon: <AlertCircle size={40} />,
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-500',
    iconBorder: 'border-red-500/20',
    buttonBg: 'bg-red-600 hover:bg-red-500'
  },
  success: {
    icon: <CheckCircle2 size={40} />,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    iconBorder: 'border-emerald-500/20',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-500'
  },
  info: {
    icon: <Info size={40} />,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    iconBorder: 'border-blue-500/20',
    buttonBg: 'bg-blue-600 hover:bg-blue-500'
  }
};

export default function StatusModal({
  isOpen,
  onClose,
  type,
  title,
  message
}: StatusModalProps) {
  const config = typeConfig[type];

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000]"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-[2001] p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-[#0e0e0e] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="p-8 text-center">
                {/* Icon */}
                <div className={`w-20 h-20 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-6 ${config.iconColor} border ${config.iconBorder}`}>
                  {config.icon}
                </div>
                
                <h3 className="text-2xl font-black text-white tracking-tight mb-2 uppercase">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed px-4">
                  {message}
                </p>
              </div>

              {/* Action Button */}
              <div className="p-8 pt-0">
                <button
                  onClick={onClose}
                  className={`w-full ${config.buttonBg} text-white font-black py-4 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-xs`}
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
