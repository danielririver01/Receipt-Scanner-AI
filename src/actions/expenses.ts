'use server';

import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { savePriceHistory } from './priceHistory';

export async function saveExpense(data: {
  amount: number;
  description: string;
  date: string;
  categoryName: string;
  receiptUrl?: string;
  ocrText?: string;
  items?: string;
  amountConfidence?: number;
  itemsConfidence?: number;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  let category = await prisma.category.findFirst({
    where: { name: data.categoryName, userId }
  });

  if (!category) {
    category = await prisma.category.create({
      data: { name: data.categoryName, userId, updatedAt: new Date() }
    });
  }

  const expense = await prisma.expense.create({
    data: {
      amount: data.amount,
      amountConfidence: data.amountConfidence || null,
      description: data.description,
      date: new Date(data.date + 'T00:00:00'),
      categoryId: category.id,
      userId,
      receiptUrl: data.receiptUrl,
      ocrText: data.ocrText,
      items: data.items || null,
      itemsConfidence: data.itemsConfidence || null,
      updatedAt: new Date()
    }
  });

  if (data.items) {
    const parsedItems: Array<{ name: string; price: number; quantity?: number; unit?: string }> =
      JSON.parse(data.items);
    await savePriceHistory(userId, expense.id, data.description, data.date, parsedItems);
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/activity');
  return expense;
}

export async function updateExpense(data: {
  id: string;
  amount: number;
  description: string;
  date: string;
  categoryName: string;
  items?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  let category = await prisma.category.findFirst({
    where: { name: data.categoryName, userId }
  });

  if (!category) {
    category = await prisma.category.create({
      data: { name: data.categoryName, userId, updatedAt: new Date() }
    });
  }

  const expense = await prisma.expense.update({
    where: { id: data.id, userId },
    data: {
      amount: data.amount,
      description: data.description,
      date: new Date(data.date + 'T00:00:00'),
      categoryId: category.id,
      items: data.items || null,
      updatedAt: new Date()
    }
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/activity');
  return expense;
}

export async function deleteExpense(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  await prisma.expense.delete({
    where: { id, userId }
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/activity');
  return { success: true };
}
