'use server';

import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createCategory(name: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  await prisma.category.create({
    data: {
      name,
      userId
    }
  });

  revalidatePath('/dashboard/categories');
}

export async function deleteCategory(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  await prisma.category.delete({
    where: { id, userId }
  });

  revalidatePath('/dashboard/categories');
}

export async function setBudget(categoryId: string, amount: number) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  await prisma.budget.upsert({
    where: {
      categoryId_month_year: {
        categoryId,
        month,
        year
      }
    },
    update: { amount },
    create: {
      amount,
      categoryId,
      userId,
      month,
      year
    }
  });

  revalidatePath('/dashboard');
}
