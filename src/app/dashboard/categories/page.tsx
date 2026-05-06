import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import CategoriesWrapper from "@/components/CategoriesWrapper";

export default async function CategoriesPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const categories = await prisma.velzia_category.findMany({
    where: { userId },
    include: {
      budget: {
        where: {
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        },
      },
    },
  });

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Categorías y Presupuestos</h1>
        <p className="text-gray-500">Define tus límites mensuales para un control absoluto.</p>
      </header>

      <CategoriesWrapper initialCategories={categories} />
    </div>
  );
}
