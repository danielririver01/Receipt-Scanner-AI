'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Zap } from 'lucide-react';
import TokenRechargeModal from './TokenRechargeModal';

interface TokenData {
  is_elite: boolean;
  total_available: number;
  plan_limit: number;
  tokens_used: number;
  usage_percent: number;
}

export default function TokenIndicator({ variant = 'sidebar' }: { variant?: 'sidebar' | 'mobile' }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [showRecharge, setShowRecharge] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    async function fetchTokens() {
      try {
        const res = await fetch('/api/tokens/status');
        if (!res.ok) return;
        const contentType = res.headers.get('content-type');
        if (!contentType?.includes('application/json')) return;
        const data = await res.json();
        setTokenData(data);
      } catch (err) {
        console.error('[TokenIndicator]', err);
      }
    }

    fetchTokens();
    const interval = setInterval(fetchTokens, 60000);
    window.addEventListener('focus', fetchTokens);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchTokens);
    };
  }, [isLoaded, isSignedIn]);

  if (!tokenData) return null;

  const { is_elite, total_available, plan_limit } = tokenData;
  const percent = is_elite ? 100 : Math.max(0, Math.min(100, (total_available / (plan_limit || 10)) * 100));

  let barColor = 'bg-orange-500';
  if (is_elite) barColor = 'bg-emerald-500';
  else if (total_available < 5) barColor = 'bg-red-500';
  else if (total_available < (plan_limit || 10) * 0.3) barColor = 'bg-yellow-500';

  // Mobile: small badge in header
  if (variant === 'mobile') {
    return (
      <>
        <button
          onClick={() => setShowRecharge(true)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
        >
          <Zap className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-xs font-black text-white">{total_available}</span>
        </button>
        <TokenRechargeModal isOpen={showRecharge} onClose={() => setShowRecharge(false)} />
      </>
    );
  }

  // Sidebar: full bar with label
  return (
    <>
      <button
        onClick={() => setShowRecharge(true)}
        className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all group flex items-center gap-3"
      >
        <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-orange-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tokens IA</span>
            <span className="text-xs font-black text-white">{is_elite ? '∞' : total_available}</span>
          </div>
          <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${percent}%` }} />
          </div>
        </div>
      </button>
      <TokenRechargeModal isOpen={showRecharge} onClose={() => setShowRecharge(false)} />
    </>
  );
}
