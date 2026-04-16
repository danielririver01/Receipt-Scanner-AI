'use server';

import { auth } from '@clerk/nextjs/server';
import cloudinary from '@/lib/cloudinary';
import openai from '@/lib/openai';
import prisma from '@/lib/prisma';

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

  // 2. OCR and Analysis with OpenAI Vision
  const categories = await prisma.category.findMany({
    where: { userId },
    select: { name: true }
  });

  const categoryNames = categories.map(c => c.name).join(', ');

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert receipt analyzer. Extract the following information from the receipt image in JSON format:
        - amount: number (total amount)
        - merchant: string (name of the store or company)
        - date: string (ISO format or YYYY-MM-DD)
        - category: string (must be one of the following: ${categoryNames} or "Other" if none match)
        - description: string (brief description of what was bought)
        - ocrText: string (full text extracted from receipt)

        Only return the JSON object.`
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Analyze this receipt:" },
          {
            type: "image_url",
            image_url: {
              "url": imageUrl,
            },
          },
        ],
      },
    ],
    response_format: { type: "json_object" }
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');

  return {
    ...result,
    imageUrl
  };
}
