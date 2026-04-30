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
  const resp = await fetch(`${VELZIA_API}/api/tokens/consume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${clerkToken}`
    },
    body: JSON.stringify({ clerk_id: clerkId })
  });

  if (resp.status === 402) {
    throw new Error('Tokens insuficientes. Por favor, recarga en el Dashboard de Velzia.');
  }

  if (!resp.ok) {
    throw new Error('Error al validar tokens con Velzia.');
  }

  return await resp.json();
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

  // 1. Consumo Atómico de Token (Velzia 2.0.0)
  await consumeToken(clerkToken, userId);

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
    const { data: { text } } = await Tesseract.recognize(buffer, 'spa+eng');

    // 4. Structure Data with DeepSeek-V3
    const categories = await prisma.category.findMany({
      where: { userId },
      select: { name: true }
    });

    const categoryNames = categories.map((c: { name: string }) => c.name).join(', ');

    const deepseekResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
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
      })
    });

    if (!deepseekResponse.ok) throw new Error('Failed to process data with DeepSeek');

    const deepseekResult = await deepseekResponse.json();
    const structuredData = JSON.parse(deepseekResult.choices[0].message.content || '{}');

    return {
      ...structuredData,
      ocrText: text,
      imageUrl
    };

  } catch (error) {
    // Reembolso en caso de fallo catastrófico (petición de usuario)
    console.error('OCR Process failed, refunding token...', error);
    await refundToken(clerkToken, userId);
    throw error;
  }
}
