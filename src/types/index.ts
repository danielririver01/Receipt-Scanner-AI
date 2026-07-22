export interface Item {
  name: string;
  price: number;
  confidence?: number;
  quantity?: number;
  unit?: string;
}

export interface Expense {
  id: string;
  description: string;
  date: Date;
  amount: number;
  amountConfidence: number | null;
  itemsConfidence: number | null;
  category: { name: string; id?: string };
  receiptUrl: string | null;
  ocrText: string | null;
  items: string | null;
}

export interface Category {
  id: string;
  name: string;
  budget: { amount: number }[];
}

export interface Budget {
  amount: number;
}

export interface PurchaseFinding {
  type: 'unusual' | 'best' | 'trend' | 'drop' | 'provider';
  productName: string;
  currentPrice: number;
  headline: string;
  detail: string;
  impact: number;
}

export interface PurchaseFindingsResult {
  findings: PurchaseFinding[];
  totalOvercost: number;
  hasHistory: boolean;
}

export interface ProductPricePoint {
  date: string;
  price: number;
}

export interface ProductMerchantStat {
  merchant: string;
  avg: number;
  count: number;
}

export interface ProductHistory {
  productName: string;
  series: ProductPricePoint[];
  avg: number;
  min: number;
  max: number;
  count: number;
  lastPrice: number | null;
  lastDate: string | null;
  firstDate: string | null;
  trendNote: string | null;
  normBase: string | null;
  merchants: ProductMerchantStat[];
}

export interface OCRResult {
  amount: number;
  amountConfidence: number;
  merchant: string;
  date: string;
  category: string;
  description: string;
  ocrText: string;
  imageUrl: string;
  items: Item[];
  itemsConfidence: number;
  findings?: PurchaseFindingsResult;
}
