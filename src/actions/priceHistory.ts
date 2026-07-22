'use server';

import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import {
  PurchaseFinding,
  PurchaseFindingsResult,
  ProductHistory,
  ProductPricePoint,
  ProductMerchantStat,
} from '@/types';

const UNUSUAL_THRESHOLD = 0.15;
const TREND_STREAK = 3;

type NormBase = '100g' | '100ml' | 'ud';

function normalizeUnit(unit: string | null | undefined): 'weight' | 'volume' | 'count' | null {
  if (!unit) return null;
  const u = String(unit).toLowerCase().trim();
  const weights = ['g', 'gr', 'grs', 'gramo', 'gramos', 'kg', 'kilo', 'kilos', 'mg'];
  const volumes = ['ml', 'cc', 'l', 'lt', 'litro', 'litros'];
  const counts = ['ud', 'un', 'unidad', 'unidades', 'pza', 'pzas', 'pieza', 'u'];
  if (weights.some((w) => u === w || u.startsWith(w))) return 'weight';
  if (volumes.some((w) => u === w || u.startsWith(w))) return 'volume';
  if (counts.some((w) => u === w || u.startsWith(w))) return 'count';
  return null;
}

function normalizeItem(
  price: number,
  quantity: number | null | undefined,
  unit: string | null | undefined
): { normPrice: number; normBase: NormBase } | null {
  const type = normalizeUnit(unit);
  if (!type || quantity == null || isNaN(Number(quantity)) || Number(quantity) <= 0) return null;
  const q = Number(quantity);
  const u = String(unit).toLowerCase();
  if (type === 'weight') {
    let grams = q;
    if (u.startsWith('kg') || u.startsWith('kilo')) grams = q * 1000;
    else if (u.startsWith('mg')) grams = q / 1000;
    if (grams <= 0) return null;
    return { normPrice: price / (grams / 100), normBase: '100g' };
  }
  if (type === 'volume') {
    let ml = q;
    if (u.startsWith('l')) ml = q * 1000;
    if (ml <= 0) return null;
    return { normPrice: price / (ml / 100), normBase: '100ml' };
  }
  return { normPrice: price / q, normBase: 'ud' };
}

function formatCOP(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CO');
}

export async function getPurchaseFindings(
  userId: string,
  items: Array<{ name: string; price: number; quantity?: number; unit?: string }>,
  merchant: string
): Promise<PurchaseFindingsResult> {
  if (!items || items.length === 0) {
    return { findings: [], totalOvercost: 0, hasHistory: false };
  }

  const names = items.map((i) => i.name);
  const records = await prisma.price_history.findMany({
    where: { userId, productName: { in: names } },
    orderBy: { date: 'desc' },
    select: { productName: true, price: true, date: true, merchant: true, normPrice: true, normBase: true },
  });

  const byProduct = new Map<
    string,
    { price: number; date: Date; merchant: string | null; normPrice: number | null; normBase: string | null }[]
  >();
  for (const r of records) {
    if (!byProduct.has(r.productName)) byProduct.set(r.productName, []);
    byProduct.get(r.productName)!.push({
      price: r.price,
      date: r.date,
      merchant: r.merchant,
      normPrice: r.normPrice,
      normBase: r.normBase,
    });
  }

  const candidates: PurchaseFinding[] = [];
  let totalOvercost = 0;

  for (const item of items) {
    const hist = byProduct.get(item.name);
    if (!hist || hist.length === 0) continue;

    const currentNorm = normalizeItem(item.price, item.quantity, item.unit);
    const currentValue = currentNorm ? currentNorm.normPrice : item.price;
    const currentFactor = currentNorm ? item.price / currentNorm.normPrice : 1;

    let useNorm = false;
    let normBase: string | null = null;
    if (currentNorm) {
      const matching = hist.filter((h) => h.normBase === currentNorm.normBase && h.normPrice != null);
      if (matching.length > 0) {
        useNorm = true;
        normBase = currentNorm.normBase;
      }
    }

    const values = useNorm
      ? hist.filter((h) => h.normBase === normBase && h.normPrice != null).map((h) => h.normPrice!)
      : hist.map((h) => h.price);

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const prevValue = values[0];
    const oldestDate = hist[hist.length - 1].date;
    const spanMonths = Math.max(
      1,
      Math.round((Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
    );

    const current = item.price;
    const diff = currentValue - avg;
    const pct = avg > 0 ? Math.round((diff / avg) * 100) : 0;
    const fairPrice = avg * currentFactor;
    const overcost = Math.max(0, current - fairPrice);
    const savings = Math.max(0, fairPrice - current);
    const currentIsUp = currentValue > prevValue;
    const currentIsDown = currentValue < prevValue;

    let streakUp = 0;
    for (let i = 0; i < values.length - 1; i++) {
      if (values[i] > values[i + 1]) streakUp++;
      else break;
    }
    const effectiveUp = (currentIsUp ? 1 : 0) + streakUp;

    if (currentValue > avg * (1 + UNUSUAL_THRESHOLD)) {
      candidates.push({
        type: 'unusual',
        productName: item.name,
        currentPrice: current,
        headline: `${item.name} cuesta ${pct}% más`,
        detail: `Hoy pagaste ${formatCOP(overcost)} más que tu precio habitual.`,
        impact: overcost,
      });
    }

    if (currentValue <= min) {
      candidates.push({
        type: 'best',
        productName: item.name,
        currentPrice: current,
        headline: `Excelente compra: ${item.name}`,
        detail: `Es el mejor precio registrado en los últimos ${spanMonths} meses.`,
        impact: -savings,
      });
    }

    if (effectiveUp >= TREND_STREAK) {
      candidates.push({
        type: 'trend',
        productName: item.name,
        currentPrice: current,
        headline: `${item.name} acumula ${effectiveUp} aumentos seguidos`,
        detail: `Viene subiendo compra tras compra.`,
        impact: overcost,
      });
    }

    if (currentIsDown && streakUp >= 1) {
      candidates.push({
        type: 'drop',
        productName: item.name,
        currentPrice: current,
        headline: `Buen momento para comprar ${item.name}`,
        detail: `Es la primera reducción de precio en ${spanMonths} meses.`,
        impact: -savings,
      });
    }

    if (merchant) {
      const merchantMap = new Map<string, number[]>();
      for (const h of hist) {
        if (!h.merchant) continue;
        const v =
          useNorm && h.normBase === normBase && h.normPrice != null ? h.normPrice : h.price;
        if (!merchantMap.has(h.merchant)) merchantMap.set(h.merchant, []);
        merchantMap.get(h.merchant)!.push(v);
      }
      const merchantAvgs = [...merchantMap.entries()]
        .map(([m, ps]) => ({ merchant: m, avg: ps.reduce((a, b) => a + b, 0) / ps.length, count: ps.length }))
        .filter((x) => x.count >= 2)
        .sort((a, b) => a.avg - b.avg);

      if (merchantAvgs.length >= 2) {
        const best = merchantAvgs[0];
        const currentAvg = merchantAvgs.find((x) => x.merchant === merchant);
        if (currentAvg && best.merchant === merchant) {
          const next = merchantAvgs[1];
          const delta = (next.avg - best.avg) * currentFactor;
          if (delta > 0) {
            candidates.push({
              type: 'provider',
              productName: item.name,
              currentPrice: current,
              headline: `${merchant} sigue siendo el más económico`,
              detail: `Para ${item.name} sale ~${formatCOP(delta)} más barato que en ${next.merchant}.`,
              impact: delta,
            });
          }
        } else if (currentAvg && best.avg < currentAvg.avg) {
          const delta = (currentAvg.avg - best.avg) * currentFactor;
          candidates.push({
            type: 'provider',
            productName: item.name,
            currentPrice: current,
            headline: `Ojo con el proveedor`,
            detail: `En ${best.merchant} ${item.name} sale ~${formatCOP(delta)} más barato que en ${merchant}.`,
            impact: delta,
          });
        }
      }
    }

    if (overcost > 0) totalOvercost += overcost;
  }

  candidates.sort((a, b) => b.impact - a.impact);
  const findings = candidates.slice(0, 3);

  return { findings, totalOvercost, hasHistory: records.length > 0 };
}

export async function getProductHistory(
  productName: string
): Promise<ProductHistory | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const rows = await prisma.price_history.findMany({
    where: { userId, productName },
    orderBy: { date: 'asc' },
    select: { price: true, date: true, merchant: true, normPrice: true, normBase: true },
  });

  if (rows.length === 0) return null;

  const values = rows.map((r) => (r.normPrice != null ? r.normPrice : r.price));
  const prices = rows.map((r) => r.price);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const series = rows.map((r) => ({
    date: r.date.toISOString().split('T')[0],
    price: r.normPrice != null ? r.normPrice : r.price,
  }));

  const normBases = [...new Set(rows.map((r) => r.normBase).filter((b): b is string => !!b))];
  const normBase = normBases.length === 1 ? normBases[0] : null;

  const merchantMap = new Map<string, number[]>();
  for (const r of rows) {
    if (!r.merchant) continue;
    if (!merchantMap.has(r.merchant)) merchantMap.set(r.merchant, []);
    merchantMap.get(r.merchant)!.push(r.normPrice != null ? r.normPrice : r.price);
  }
  const merchants = [...merchantMap.entries()]
    .map(([m, ps]) => ({ merchant: m, avg: Math.round(ps.reduce((a, b) => a + b, 0) / ps.length), count: ps.length }))
    .filter((x) => x.count >= 2)
    .sort((a, b) => a.avg - b.avg);

  let streakUp = 0;
  for (let i = rows.length - 1; i > 0; i--) {
    if (values[i] > values[i - 1]) streakUp++;
    else break;
  }

  let trendNote: string | null = null;
  if (streakUp >= 3) trendNote = `Viene subiendo en tus últimas ${streakUp} compras.`;
  else if (rows.length >= 2 && values[rows.length - 1] < values[rows.length - 2])
    trendNote = `Bajó respecto a tu compra anterior.`;
  else if (rows.length >= 2 && values[rows.length - 1] > values[rows.length - 2])
    trendNote = `Subió respecto a tu compra anterior.`;

  return {
    productName,
    series,
    avg,
    min,
    max,
    count: prices.length,
    lastPrice: prices[prices.length - 1],
    lastDate: series[series.length - 1].date,
    firstDate: series[0].date,
    trendNote,
    normBase,
    merchants,
  };
}

export async function savePriceHistory(
  userId: string,
  expenseId: string,
  merchant: string,
  date: string,
  items: Array<{ name: string; price: number; quantity?: number; unit?: string }>
) {
  if (!items || items.length === 0) return;

  const records = items.map((item) => {
    const norm = normalizeItem(item.price, item.quantity, item.unit);
    return {
      userId,
      productName: item.name,
      price: item.price,
      unit: item.unit ?? null,
      quantity: item.quantity ?? null,
      normPrice: norm?.normPrice ?? null,
      normBase: norm?.normBase ?? null,
      merchant,
      date: new Date(date + 'T00:00:00'),
      expenseId,
    };
  });

  await prisma.price_history.createMany({ data: records });
}
