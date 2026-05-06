'use server';

import { auth } from '@clerk/nextjs/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

/**
 * Extract text from image using Google Vision API
 */
async function extractTextWithGoogleVision(buffer: Buffer): Promise<string> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_VISION_API_KEY is not configured');
  }

  // Convert buffer to base64
  const base64Image = buffer.toString('base64');

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: 'TEXT_DETECTION' }],
          },
        ],
      }),
      signal: AbortSignal.timeout(30000), // 30 seconds timeout
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[OCR] Google Vision API error:', response.status, errorText);
    throw new Error(`Google Vision API error: ${response.status}`);
  }

  const result = await response.json();
  
  // Extract text from response
  if (result.responses?.[0]?.fullTextAnnotation?.text) {
    return result.responses[0].fullTextAnnotation.text;
  }
  
  // Fallback to textAnnotations
  if (result.responses?.[0]?.textAnnotations?.[0]?.description) {
    return result.responses[0].textAnnotations[0].description;
  }

  return ''; // No text found
}



async function consumeToken(clerkToken: string, clerkId: string) {
  try {
    const user = await prisma.users.findUnique({
      where: { clerk_id: clerkId },
      include: { ai_token_wallets: true, restaurants: true }
    });

    if (!user || !user.ai_token_wallets) {
      throw new Error('Usuario no encontrado');
    }

    const wallet = user.ai_token_wallets;
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

    const totalAvailable = wallet.plan_tokens + wallet.extra_tokens;
    if (totalAvailable <= 0) {
      throw new Error('Tokens insuficientes. Por favor, recarga en el Dashboard de Velzia.');
    }

    if (wallet.plan_tokens > 0) {
      await prisma.ai_token_wallets.update({
        where: { user_id: user.id },
        data: { plan_tokens: { decrement: 1 }, tokens_used_month: { increment: 1 } }
      });
    } else {
      await prisma.ai_token_wallets.update({
        where: { user_id: user.id },
        data: { extra_tokens: { decrement: 1 }, tokens_used_month: { increment: 1 } }
      });
    }

    await prisma.ai_token_transactions.create({
      data: {
        user_id: user.id,
        type: 'consume',
        amount: -1,
        source: 'scanner_ia',
        description: 'OCR scan consumir'
      }
    });

    const updatedWallet = await prisma.ai_token_wallets.findUnique({ where: { user_id: user.id } });
    const remaining = (updatedWallet?.plan_tokens || 0) + (updatedWallet?.extra_tokens || 0);

    return { success: true, tokens_remaining: remaining };
  } catch (error: any) {
    console.error('[OCR] Error in consumeToken:', error);
    throw error;
  }
}

async function refundToken(clerkToken: string, clerkId: string) {
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

    const wallet = user.ai_token_wallets;
    if (wallet.plan_tokens < wallet.plan_limit) {
      await prisma.ai_token_wallets.update({
        where: { user_id: user.id },
        data: { plan_tokens: { increment: 1 }, tokens_used_month: { decrement: 1 } }
      });
    } else {
      await prisma.ai_token_wallets.update({
        where: { user_id: user.id },
        data: { extra_tokens: { increment: 1 }, tokens_used_month: { decrement: 1 } }
      });
    }

    await prisma.ai_token_transactions.create({
      data: {
        user_id: user.id,
        type: 'refund',
        amount: 1,
        source: 'scanner_ia',
        description: 'OCR scan reembolso'
      }
    });
  } catch (e) {
    console.error('Error procesando reembolso:', e);
  }
}

export async function processReceipt(formData: FormData) {
  const { userId, getToken } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const clerkToken = await getToken();
  if (!clerkToken) throw new Error('Could not retrieve Clerk Token');

  console.log('[OCR] Starting process for user:', userId);
  console.log('[OCR] Consuming token...');
  await consumeToken(clerkToken, userId);
  console.log('[OCR] Token consumed successfully');

  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileExtension = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadsDir, fileName);

    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    const imageUrl = `/uploads/${fileName}`;

    // Extract Text with Google Vision API
    console.log('[OCR] Sending image to Google Vision API...');
    const text = await extractTextWithGoogleVision(buffer);
    console.log('[OCR] Google Vision complete. Text length:', text.length);

    if (!text || text.trim() === '') {
      throw new Error('No se pudo extraer texto de la imagen. Intenta con una imagen más clara.');
    }

    // Structure Data with DeepSeek
    console.log('[OCR] Fetching categories from database...');
    const categories = await prisma.velzia_category.findMany({
      where: { userId },
      select: { name: true }
    });

    const categoryNames = categories.map((c: { name: string }) => c.name);
    const hasCategories = categoryNames.length > 0;

    console.log('[OCR] Sending data to DeepSeek API...');
    const dsController = new AbortController();
    const dsTimeout = setTimeout(() => dsController.abort(), 30000);

    const systemPrompt = hasCategories
      ? `Eres un experto en extracción de datos de recibos y facturas. Convierte el texto OCR en un JSON con:
- amount: número total del recibo
- merchant: nombre del establecimiento
- date: fecha en formato YYYY-MM-DD
- category: una de estas categorías EXACTAMENTE: ${categoryNames.join(', ')}
- description: descripción breve del gasto
- items: ARRAY de productos del ticket, cada uno con "name" (nombre del producto) y "price" (precio individual). EJEMPLO: [{"name": "Hamburguesa", "price": 15000}, {"name": "Gaseosa", "price": 5000}]. Extrae TODOS los productos que puedas identificar.

IMPORTANTE: La categoría debe ser exactamente una de las listadas. Si no puedes identificar productos, usa un array vacío "items": [].`
      : `Eres un experto en extracción de datos de recibos y facturas. Convierte el texto OCR en un JSON con:
- amount: número total del recibo
- merchant: nombre del establecimiento
- date: fecha en formato YYYY-MM-DD
- category: usa "Otros"
- description: descripción breve del gasto
- items: ARRAY de productos del ticket, cada uno con "name" y "price". EJEMPLO: [{"name": "Producto 1", "price": 5000}, {"name": "Producto 2", "price": 8000}]`;

    const deepseekResponse = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" }
      }),
      signal: dsController.signal
    });
    clearTimeout(dsTimeout);

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      console.error('[OCR] DeepSeek API error:', deepseekResponse.status, errorText);
      throw new Error(`Failed to process data with DeepSeek: ${deepseekResponse.status}`);
    }

    const deepseekResult = await deepseekResponse.json();
    console.log('[OCR] DeepSeek response received');
    let structuredData = JSON.parse(deepseekResult.choices[0].message.content || '{}');

    // Calculate confidence based on data quality
    let amountConfidence = 1.0;
    let itemsConfidence = 1.0;

    // Check if items sum matches total
    if (structuredData.items && Array.isArray(structuredData.items)) {
      const itemsSum = structuredData.items.reduce((sum: number, item: { price: number }) => sum + (item.price || 0), 0);
      if (itemsSum > 0 && structuredData.amount > 0) {
        const difference = Math.abs(itemsSum - structuredData.amount);
        const percentDiff = difference / structuredData.amount;
        if (percentDiff > 0.05) { // More than 5% difference
          itemsConfidence = 0.5; // Low confidence
        } else if (percentDiff > 0.01) {
          itemsConfidence = 0.8; // Medium confidence
        }
      }
    }

    // If no items extracted, low confidence on amount
    if (!structuredData.items || structuredData.items.length === 0) {
      amountConfidence = 0.7;
    }

    if (!structuredData.category || structuredData.category.trim() === '') {
      structuredData.category = 'Otros';
    }

    console.log('[OCR] Structured data:', structuredData);
    console.log('[OCR] Confidence - amount:', amountConfidence, 'items:', itemsConfidence);

    return {
      ...structuredData,
      ocrText: text,
      imageUrl,
      amountConfidence,
      itemsConfidence
    };

  } catch (error: any) {
    console.error('OCR Process failed, refunding token...', error);
    await refundToken(clerkToken, userId);

    if (error.name === 'AbortError') {
      throw new Error('La IA de DeepSeek tardó demasiado en responder (Timeout).');
    }

    throw error;
  }
}
