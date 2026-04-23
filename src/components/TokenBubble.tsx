'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Diamond, Zap, ExternalLink } from 'lucide-react';

const VELZIA_API = process.env.NEXT_PUBLIC_VELZIA_API_URL || 'http://localhost:5000';

interface TokenStatus {
  is_elite: boolean;
  total_available: number;
  plan_limit: number;
  tokens_used: number;
}

export default function TokenBubble() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [status, setStatus] = useState<TokenStatus | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;

      const resp = await fetch(`${VELZIA_API}/api/tokens/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (resp.ok) {
        const data = await resp.json();
        setStatus(data);
        setIsReady(true);
      }
    } catch (error) {
      console.error('Error fetching token status:', error);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchStatus();
      
      // Polling cada minuto
      const interval = setInterval(fetchStatus, 60000);
      
      // Actualizar al recuperar el foco de la ventana
      window.addEventListener('focus', fetchStatus);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', fetchStatus);
      };
    }
  }, [isLoaded, isSignedIn, fetchStatus]);

  if (!isSignedIn || !isReady) return null;

  const available = status?.total_available ?? 0;
  const limit = status?.plan_limit ?? 10;
  const percent = Math.max(0, Math.min(100, (available / limit) * 100));
  const isElite = status?.is_elite ?? false;

  // Circunferencia para radio 24: 2 * pi * 24 = 150.8
  const circumference = 150.8;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  const colorClass = available < 5 ? '#ef4444' : available < limit * 0.3 ? '#eab308' : '#22c55e';

  return (
    <div className="fixed bottom-6 left-6 z-[100] flex items-center justify-center font-sans tracking-tight">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-4 left-0 w-64 bg-[#0e0e0e] border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Estado de Tokens</span>
                {available < 5 && <span className="text-red-500 animate-pulse text-[9px]">Crítico</span>}
              </div>
              
              <div className="flex flex-col">
                <span className="text-lg font-black text-white">
                  {isElite ? 'Plan Elite' : `${available} disponibles`}
                </span>
                <span className="text-[10px] text-gray-500 font-medium -mt-1">
                  {isElite ? 'Acceso ilimitado a IA' : `Consumidos: ${status?.tokens_used} de ${limit}`}
                </span>
              </div>

              {/* Botón de Recarga (Upselling) */}
              <a 
                href="http://localhost:5000/dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-xl text-[11px] font-black uppercase transition-all active:scale-95 shadow-lg shadow-orange-500/20"
              >
                <Zap size={14} className="fill-current" />
                Recargar Tokens
                <ExternalLink size={12} className="ml-0.5 opacity-60" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        layoutId="token-bubble"
        onHoverStart={() => setShowTooltip(true)}
        onHoverEnd={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative w-14 h-14 bg-[#0a0a0a] border border-white/5 rounded-full shadow-2xl flex items-center justify-center cursor-pointer group"
      >
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle 
            cx="28" cy="28" r="24" 
            stroke="rgba(255,255,255,0.05)" 
            strokeWidth="3" 
            fill="transparent" 
          />
          <motion.circle 
            cx="28" cy="28" r="24" 
            stroke={colorClass} 
            strokeWidth="3" 
            strokeLinecap="round"
            fill="transparent" 
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>

        <div className="relative z-10 flex flex-col items-center">
          {isElite ? (
            <Diamond className="text-indigo-400" size={20} fill="#6366f1" />
          ) : (
            <span className="text-white font-black text-sm">
              {available}
            </span>
          )}
        </div>

        {available < 5 && (
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }} 
            transition={{ repeat: Infinity, duration: 1 }}
            className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-600 rounded-full border-2 border-[#0a0a0a]" 
          />
        )}
      </motion.div>
    </div>
  );
}
