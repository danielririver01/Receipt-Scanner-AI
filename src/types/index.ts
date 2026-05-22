export interface Item {
  name: string;
  price: number;
  confidence?: number;
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
}
