'use server';

import { auth } from '@clerk/nextjs/server';
import cloudinary from '@/lib/cloudinary';
import prisma from '@/lib/prisma';
import Tesseract from 'tesseract.js';

export async function processReceipt(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const file = formData.get('file') as File;
  if (!file) throw new Error('No file provided');

  // 1. Upload to Cloudinary
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const uploadResponse = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder: 'receipts' }, (error, result) => {
      if (error || !result) reject(error || new Error('Upload failed'));
      else resolve(result as { secure_url: string });
    }).end(buffer);
  });

  const imageUrl = uploadResponse.secure_url;

  // 2. Step 1: Extract Raw Text with Tesseract.js
  const { data: { text } } = await Tesseract.recognize(imageUrl, 'spa+eng');

  // 3. Step 2: Structure Data with DeepSeek-V3
  const categories = await prisma.category.findMany({
    where: { userId },
    select: { name: true }
  });

  const categoryNames = categories.map(c => c.name).join(', ');

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
          Tu tarea es tomar el texto extraído por un OCR (que puede tener errores o estar desordenado) y convertirlo en un objeto JSON estructurado.

          El JSON debe tener exactamente estos campos:
          - amount: number (monto total del ticket)
          - merchant: string (nombre del comercio o empresa)
          - date: string (fecha en formato ISO YYYY-MM-DD o similar)
          - category: string (debe ser una de estas: ${categoryNames || 'Otros'}. Si no encaja en ninguna, usa "Otros")
          - description: string (una breve descripción de lo comprado o el nombre del comercio)
          - ocrText: string (el texto original que recibiste)

          Responde ÚNICAMENTE con el objeto JSON.`
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!deepseekResponse.ok) {
    const errorData = await deepseekResponse.text();
    console.error('DeepSeek API Error:', errorData);
    throw new Error('Failed to process data with DeepSeek');
  }

  const deepseekResult = await deepseekResponse.json();
  const structuredData = JSON.parse(deepseekResult.choices[0].message.content || '{}');

  return {
    ...structuredData,
    ocrText: text, // Use the actual Tesseract text
    imageUrl
  };
}
