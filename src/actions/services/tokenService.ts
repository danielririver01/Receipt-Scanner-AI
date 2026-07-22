import prisma from '@/lib/prisma';

export async function consumeToken(clerkId: string) {
  try {
    const user = await prisma.users.findUnique({
      where: { clerk_id: clerkId },
      include: { ai_token_wallets: true, restaurants: true }
    });

    if (!user || !user.ai_token_wallets) {
      throw new Error('Usuario no encontrado');
    }

    const isElite = user.restaurants?.plan_type === 'elite';

    if (isElite) {
      await prisma.ai_token_transactions.create({
        data: {
          user_id: user.id,
          type: 'elite_scan',
          amount: 0,
          source: 'scanner_ia',
          description: 'Scan ilimitado — Plan Elite'
        }
      });
      return { success: true, tokens_remaining: 300, is_elite: true };
    }

    const result = await prisma.$transaction(async (tx) => {
      // Leer el wallet dentro de la transacción para evitar TOCTOU.
      // Si dos requests concurrentes llegan, una espera a que la otra
      // termine gracias al aislamiento de Prisma/MySQL.
      const wallet = await tx.ai_token_wallets.findUnique({
        where: { user_id: user.id }
      });

      if (!wallet) {
        throw new Error('Wallet no encontrado');
      }

      const totalAvailable = wallet.plan_tokens + wallet.extra_tokens;
      if (totalAvailable <= 0) {
        throw new Error('Tokens insuficientes. Por favor, recarga en el Dashboard de Velzia.');
      }

      if (wallet.plan_tokens > 0) {
        await tx.ai_token_wallets.update({
          where: { user_id: user.id },
          data: { plan_tokens: { decrement: 1 }, tokens_used_month: { increment: 1 } }
        });
      } else {
        await tx.ai_token_wallets.update({
          where: { user_id: user.id },
          data: { extra_tokens: { decrement: 1 }, tokens_used_month: { increment: 1 } }
        });
      }

      await tx.ai_token_transactions.create({
        data: {
          user_id: user.id,
          type: 'consume',
          amount: -1,
          source: 'scanner_ia',
          description: 'OCR scan consumir'
        }
      });

      const updated = await tx.ai_token_wallets.findUnique({
        where: { user_id: user.id }
      });

      return (updated?.plan_tokens || 0) + (updated?.extra_tokens || 0);
    });

    return { success: true, tokens_remaining: result };
  } catch (error: any) {
    console.error('[OCR] Error in consumeToken:', error);
    throw error;
  }
}

export async function refundToken(clerkId: string) {
  try {
    const user = await prisma.users.findUnique({
      where: { clerk_id: clerkId },
      include: { ai_token_wallets: true, restaurants: true }
    });

    if (!user || !user.ai_token_wallets) {
      console.error('[OCR] Refund: usuario no encontrado');
      return;
    }

    const isElite = user.restaurants?.plan_type === 'elite';
    if (isElite) return;

    await prisma.$transaction(async (tx) => {
      const wallet = await tx.ai_token_wallets.findUnique({
        where: { user_id: user.id }
      });

      if (!wallet) return;

      if (wallet.plan_tokens < (wallet.plan_limit ?? 0)) {
        await tx.ai_token_wallets.update({
          where: { user_id: user.id },
          data: { plan_tokens: { increment: 1 }, tokens_used_month: { decrement: 1 } }
        });
      } else {
        await tx.ai_token_wallets.update({
          where: { user_id: user.id },
          data: { extra_tokens: { increment: 1 }, tokens_used_month: { decrement: 1 } }
        });
      }

      await tx.ai_token_transactions.create({
        data: {
          user_id: user.id,
          type: 'refund',
          amount: 1,
          source: 'scanner_ia',
          description: 'OCR scan reembolso'
        }
      });
    });
  } catch (e) {
    console.error('Error procesando reembolso:', e);
  }
}
