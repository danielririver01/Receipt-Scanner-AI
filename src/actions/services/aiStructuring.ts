import prisma from '@/lib/prisma';

export interface StructuredData {
  amount: number;
  merchant: string;
  date: string;
  category: string;
  description: string;
  items: Array<{ name: string; price: number }>;
}

export interface ConfidenceScores {
  amountConfidence: number;
  itemsConfidence: number;
}

function buildSystemPrompt(categoryNames: string[]): string {
  const hasCategories = categoryNames.length > 0;

  if (hasCategories) {
    return `Eres un experto en extracción de datos de recibos y facturas. Convierte el texto OCR en un JSON con:
- amount: número total del recibo
- merchant: nombre del establecimiento
- date: fecha en formato YYYY-MM-DD
- category: una de estas categorías EXACTAMENTE: ${categoryNames.join(', ')}
- description: descripción breve del gasto
- items: ARRAY de productos del ticket, cada uno con "name" (nombre del producto) y "price" (precio individual). EJEMPLO: [{"name": "Hamburguesa", "price": 15000}, {"name": "Gaseosa", "price": 5000}]. Extrae TODOS los productos que puedas identificar.

IMPORTANTE: La categoría debe ser exactamente una de las listadas. Si no puedes identificar productos, usa un array vacío "items": [].`;
  }

  return `Eres un experto en extracción de datos de recibos y facturas. Convierte el texto OCR en un JSON con:
- amount: número total del recibo
- merchant: nombre del establecimiento
- date: fecha en formato YYYY-MM-DD
- category: usa "Otros"
- description: descripción breve del gasto
- items: ARRAY de productos del ticket, cada uno con "name" y "price". EJEMPLO: [{"name": "Producto 1", "price": 5000}, {"name": "Producto 2", "price": 8000}]`;
}

function calculateConfidence(structuredData: StructuredData): ConfidenceScores {
  let amountConfidence = 1.0;
  let itemsConfidence = 1.0;

  if (structuredData.items && Array.isArray(structuredData.items)) {
    const itemsSum = structuredData.items.reduce((sum, item) => sum + (item.price || 0), 0);
    if (itemsSum > 0 && structuredData.amount > 0) {
      const difference = Math.abs(itemsSum - structuredData.amount);
      const percentDiff = difference / structuredData.amount;
      if (percentDiff > 0.05) {
        itemsConfidence = 0.5;
      } else if (percentDiff > 0.01) {
        itemsConfidence = 0.8;
      }
    }
  }

  if (!structuredData.items || structuredData.items.length === 0) {
    amountConfidence = 0.7;
  }

  if (!structuredData.category || structuredData.category.trim() === '') {
    structuredData.category = 'Otros';
  }

  return { amountConfidence, itemsConfidence };
}

export async function getCategoriesForUser(userId: string): Promise<string[]> {
  const categories = await prisma.velzia_category.findMany({
    where: { userId },
    select: { name: true }
  });
  return categories.map((c: { name: string }) => c.name);
}

export async function structureWithDeepSeek(
  ocrText: string,
  categoryNames: string[]
): Promise<{ data: StructuredData; confidence: ConfidenceScores }> {
  const hasCategories = categoryNames.length > 0;
  const systemPrompt = buildSystemPrompt(hasCategories ? categoryNames : []);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: ocrText }
      ],
      response_format: { type: "json_object" }
    }),
    signal: controller.signal
  });
  clearTimeout(timeout);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[OCR] DeepSeek API error:', response.status, errorText);
    throw new Error(`Failed to process data with DeepSeek: ${response.status}`);
  }

  const result = await response.json();
  const structuredData: StructuredData = JSON.parse(result.choices[0].message.content || '{}');
  const confidence = calculateConfidence(structuredData);

  return { data: structuredData, confidence };
}
