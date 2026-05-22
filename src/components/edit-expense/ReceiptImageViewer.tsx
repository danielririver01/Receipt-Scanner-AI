'use client';

import { motion } from 'framer-motion';
import { X, ImageIcon, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface ReceiptImageViewerProps {
  receiptUrl: string | null;
  onClose: () => void;
}

export default function ReceiptImageViewer({ receiptUrl, onClose }: ReceiptImageViewerProps) {
  const [showImage, setShowImage] = useState(false);

  return (
    <>
      {/* Desktop: Left side panel */}
      <div className="hidden md:flex md:w-1/3 flex-col">
        <div className="obsidian-card rounded-3xl p-4 border border-white/10 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Original</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {receiptUrl ? (
            <div className="flex-1 rounded-2xl overflow-hidden bg-black/50">
              <img 
                src={receiptUrl} 
                alt="Receipt" 
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="flex-1 rounded-2xl bg-black/50 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sin imagen</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Toggle button + image */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setShowImage(!showImage)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-300 font-bold text-sm hover:bg-white/10 transition-all"
        >
          {showImage ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showImage ? 'Ocultar' : 'Ver'} Original
        </button>
        {showImage && receiptUrl && (
          <div className="mt-4 rounded-2xl overflow-hidden">
            <img 
              src={receiptUrl} 
              alt="Receipt" 
              className="w-full h-auto max-h-48 object-contain bg-black/50"
            />
          </div>
        )}
      </div>
    </>
  );
}
