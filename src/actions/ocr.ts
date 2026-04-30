'use server';

import { auth } from '@clerk/nextjs/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import Tesseract from 'tesseract.js';

const VELZIA_API = process.env.NEXT_PUBLIC_VELZIA_API_URL || 'http://localhost:5000';

/**
 * Fase 2: Ayudantes de Comunicación con Velzia Token System
 */
async function consumeToken(clerkToken: string, clerkId: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout

    const resp = await fetch(`${VELZIA_API}/api/tokens/consume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clerkToken}`
      },
      body: JSON.stringify({ clerk_id: clerkId }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (resp.status === 402) {
      throw new Error('Tokens insuficientes. Por favor, recarga en el Dashboard de Velzia.');
    }

    if (!resp.ok) {
      console.error(`[OCR] Velzia API error: ${resp.status} ${resp.statusText}`);
      throw new Error('Error al validar tokens con Velzia.');
    }

    return await resp.json();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('[OCR] Token consumption timed out');
      throw new Error('El servidor de tokens no responde (Timeout).');
    }
    console.error('[OCR] Error in consumeToken:', error);
    throw error;
  }
}

async function refundToken(clerkToken: string, clerkId: string) {
  try {
    await fetch(`${VELZIA_API}/api/tokens/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clerkToken}`
      },
      body: JSON.stringify({ clerk_id: clerkId })
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
  // 1. Consumo Atómico de Token (Velzia 2.0.0)
  console.log('[OCR] Consuming token...');
  await consumeToken(clerkToken, userId);
  console.log('[OCR] Token consumed successfully');

  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    // 2. Save locally to public/uploads
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const fileExtension = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadsDir, fileName);
    
    // Asegurar que el directorio existe (doble check)
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(filePath, buffer);
    
    const imageUrl = `/uploads/${fileName}`;

    // 3. Extract Raw Text with Tesseract.js (using buffer)
    console.log('[OCR] Starting Tesseract recognition...');
    const worker = await Tesseract.createWorker('spa+eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`[OCR] Tesseract Progress: ${(m.progress * 100).toFixed(2)}%`);
        } else {
          console.log(`[OCR] Tesseract Status: ${m.status}`);
        }
      }
    });
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();
    console.log('[OCR] Tesseract recognition complete. Text length:', text.length);

    // 4. Structure Data with DeepSeek-V3
    console.log('[OCR] Fetching categories from database...');
    const categories = await prisma.category.findMany({
      where: { userId },
      select: { name: true }
    });

    const categoryNames = categories.map((c: { name: string }) => c.name).join(', ');
    console.log('[OCR] Category names:', categoryNames);

    console.log('[OCR] Sending data to DeepSeek API...');
    const dsController = new AbortController();
    const dsTimeout = setTimeout(() => dsController.abort(), 30000); // 30 segundos para DeepSeek

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
            content: `Eres un experto en extracción de datos de recibos y facturas. 
            Convierte el texto OCR en un JSON con: amount (number), merchant (string), date (YYYY-MM-DD), category (debe ser: ${categoryNames || 'Otros'}), description (string).`
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
    const structuredData = JSON.parse(deepseekResult.choices[0].message.content || '{}');
    console.log('[OCR] Structured data:', structuredData);

    return {
      ...structuredData,
      ocrText: text,
      imageUrl
    };

  } catch (error: any) {
    // Reembolso en caso de fallo catastrófico (petición de usuario)
    console.error('OCR Process failed, refunding token...', error);
    await refundToken(clerkToken, userId);

    if (error.name === 'AbortError') {
      throw new Error('La IA de DeepSeek tardó demasiado en responder (Timeout).');
    }

    throw error;
  }
}
