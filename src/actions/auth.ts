'use server';

import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function verifyUserExists(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const user = await prisma.users.findUnique({
    where: { clerk_id: userId }
  });

  return !!user;
}

export async function requireUserExists(): Promise<void> {
  const exists = await verifyUserExists();
  if (!exists) {
    throw new Error('USER_NOT_REGISTERED');
  }
}