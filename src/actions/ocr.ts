'use server';

import { auth } from '@clerk/nextjs/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { consumeToken, refundToken } from './services/tokenService';
import { extractTextWithGoogleVision } from './services/ocrService';
import { getCategoriesForUser, structureWithDeepSeek } from './services/aiStructuring';
import { getPurchaseFindings } from './priceHistory';

export async function processReceipt(formData: FormData) {
  const { userId, getToken } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const clerkToken = await getToken();
  if (!clerkToken) throw new Error('Could not retrieve Clerk Token');

  await consumeToken(userId);

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

    const text = await extractTextWithGoogleVision(buffer);

    if (!text || text.trim() === '') {
      throw new Error('No se pudo extraer texto de la imagen. Intenta con una imagen más clara.');
    }

    const categoryNames = await getCategoriesForUser(userId);

    const { data: structuredData, confidence } = await structureWithDeepSeek(text, categoryNames);

    const findings = structuredData.items && structuredData.items.length > 0
      ? await getPurchaseFindings(userId, structuredData.items, structuredData.merchant)
      : null;

    return {
      ...structuredData,
      ocrText: text,
      imageUrl,
      amountConfidence: confidence.amountConfidence,
      itemsConfidence: confidence.itemsConfidence,
      findings,
    };

  } catch (error: any) {
    console.error('OCR Process failed, refunding token...', error);
    await refundToken(userId);

    if (error.name === 'AbortError') {
      throw new Error('La IA de DeepSeek tardó demasiado en responder (Timeout).');
    }

    throw error;
  }
}
