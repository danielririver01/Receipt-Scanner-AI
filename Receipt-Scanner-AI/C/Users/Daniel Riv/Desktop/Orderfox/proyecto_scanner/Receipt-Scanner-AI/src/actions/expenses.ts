'use server';

import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function saveExpense(data: {
  amount: number;
  description: string;
  date: string;
  categoryName: string;
  receiptUrl?: string;
  ocrText?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Find or create category
  let category = await prisma.category.findFirst({
    where: { name: data.categoryName, userId }
  });

  if (!category) {
    category = await prisma.category.create({
      data: { name: data.categoryName, userId }
    });
  }

  await prisma.expense.create({
    data: {
      amount: data.amount,
      description: data.description,
      date: new Date(data.date),
      categoryId: category.id,
      userId,
      receiptUrl: data.receiptUrl,
      ocrText: data.ocrText
    }
  });

  revalidatePath('/dashboard');
}
