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
  items?: string;
  amountConfidence?: number;
  itemsConfidence?: number;
}) {
  console.log('[saveExpense] Guardando gasto:', data);
  
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  console.log('[saveExpense] userId:', userId);

  let category = await prisma.velzia_category.findFirst({
    where: { name: data.categoryName, userId }
  });

  if (!category) {
    category = await prisma.velzia_category.create({
      data: { name: data.categoryName, userId, updatedAt: new Date() }
    });
  }
  console.log('[saveExpense] category:', category);

  const expense = await prisma.velzia_expense.create({
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
  console.log('[saveExpense] Expense creado:', expense);

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
  console.log('[updateExpense] Actualizando gasto:', data);

  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  let category = await prisma.velzia_category.findFirst({
    where: { name: data.categoryName, userId }
  });

  if (!category) {
    category = await prisma.velzia_category.create({
      data: { name: data.categoryName, userId, updatedAt: new Date() }
    });
  }

  const expense = await prisma.velzia_expense.update({
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
  console.log('[deleteExpense] Eliminando gasto:', id);

  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  await prisma.velzia_expense.delete({
    where: { id, userId }
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/activity');
  return { success: true };
}
