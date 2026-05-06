import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Token Status] Fetching for userId:', userId);

    const user = await prisma.users.findFirst({
      where: { clerk_id: userId },
      include: { ai_token_wallets: true, restaurants: true }
    });

    if (!user) {
      console.log('[Token Status] User not found in DB, returning defaults');
      return NextResponse.json({
        is_elite: false,
        total_available: 0,
        plan_limit: 0,
        tokens_used: 0,
        usage_percent: 0
      });
    }

    const wallet = user.ai_token_wallets;

    if (!wallet) {
      console.log('[Token Status] No wallet found for user');
      return NextResponse.json({
        is_elite: false,
        total_available: 0,
        plan_limit: 0,
        tokens_used: 0,
        usage_percent: 0
      });
    }

    const isElite = user.restaurants?.plan_type === 'elite';
    const planLimit = wallet.plan_limit || 0;
    const planTokens = wallet.plan_tokens || 0;
    const extraTokens = wallet.extra_tokens || 0;
    const totalAvailable = isElite ? 300 : planTokens + extraTokens;
    const usagePercent = planLimit > 0 ? (wallet.tokens_used_month / planLimit) * 100 : 0;

    return NextResponse.json({
      is_elite: isElite,
      total_available: totalAvailable,
      plan_limit: isElite ? 300 : planLimit,
      tokens_used: wallet.tokens_used_month || 0,
      usage_percent: Math.min(100, usagePercent)
    });

  } catch (error: any) {
    console.error('[API] Error in token status:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
