'use server';

import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createCategory(name: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

const category = await prisma.velzia_category.create({
      data: {
        name,
        userId,
        updatedAt: new Date()
      },
    select: { id: true, name: true, budget: { select: { amount: true } } }
  });

  revalidatePath('/dashboard/categories');
  return category;
}

export async function deleteCategory(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  await prisma.velzia_category.delete({
    where: { id, userId }
  });

  revalidatePath('/dashboard/categories');
}

export async function updateCategory(id: string, name: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const category = await prisma.velzia_category.update({
    where: { id, userId },
    data: { name },
    select: { id: true, name: true }
  });

  revalidatePath('/dashboard/categories');
  return category;
}

export async function setBudget(categoryId: string, amount: number) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const budget = await prisma.velzia_budget.upsert({
    where: {
      categoryId_month_year: {
        categoryId,
        month,
        year
      }
    },
    update: { amount, updatedAt: new Date() },
    create: {
      amount,
      categoryId,
      userId,
      month,
      year,
      updatedAt: new Date()
    }
  });

  revalidatePath('/dashboard');
  return budget;
}
