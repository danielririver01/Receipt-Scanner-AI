'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import TokenRechargeModal from './TokenRechargeModal';

export default function TokenBubble() {
  const { isLoaded, isSignedIn } = useAuth();
  const [tokenData, setTokenData] = useState<{
    is_elite: boolean;
    total_available: number;
    plan_limit: number;
    tokens_used: number;
    usage_percent: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRecharge, setShowRecharge] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }

    async function updateTokenStatus() {
      try {
        const response = await fetch('/api/tokens/status');
        
        if (!response.ok) {
          console.warn('[TokenBubble] API responded with:', response.status);
          return;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('[TokenBubble] Response is not JSON, likely redirected.');
          return;
        }

        const data = await response.json();
        setTokenData(data);
      } catch (error) {
        console.error('Error actualizando tokens:', error);
      } finally {
        setLoading(false);
      }
    }

    updateTokenStatus();
    const interval = setInterval(updateTokenStatus, 60000);
    return () => clearInterval(interval);
  }, [isLoaded, isSignedIn]);

  if (loading || !tokenData) return null;

  const { is_elite, total_available, plan_limit, usage_percent } = tokenData;

  const CIRCUMFERENCE = 150.8;
  const percent = is_elite ? 100 : Math.max(0, Math.min(100, usage_percent || 0));
  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;

  let colorClass = 'text-green-400';
  let strokeClass = 'stroke-green-500';
  if (!is_elite) {
    if (total_available < 5) {
      strokeClass = 'stroke-red-500';
      colorClass = 'text-red-400';
    } else if (total_available < (plan_limit * 0.3)) {
      strokeClass = 'stroke-yellow-500';
      colorClass = 'text-yellow-400';
    }
  }

  return (
    <>
      <div className="fixed bottom-24 right-6 md:bottom-6 z-50">
        <div 
          className="relative w-16 h-16 cursor-pointer group"
          onClick={() => setShowRecharge(true)}
        >
          <svg className="transform -rotate-90" width="64" height="64" viewBox="0 0 64 64">
            <circle
              cx="32" cy="32" r="24"
              fill="#111111"
            />
            <circle
              className="stroke-white/10"
              cx="32" cy="32" r="24"
              fill="none"
              strokeWidth="4"
            />
            <circle
              className={strokeClass}
              cx="32" cy="32" r="24"
              fill="none"
              strokeWidth="4"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={is_elite ? 0 : offset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-sm font-bold ${colorClass}`}>
              {is_elite ? '\u221e' : total_available}
            </span>
          </div>

          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
            <div className="bg-gray-800 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
              {is_elite
                ? `Plan Élite: ${total_available} tokens disponibles`
                : `${total_available} tokens disponibles - Click para recargar`}
            </div>
          </div>
        </div>
      </div>

      <TokenRechargeModal 
        isOpen={showRecharge} 
        onClose={() => setShowRecharge(false)} 
      />
    </>
  );
}
