import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import dynamic from "next/dynamic";

const CategoriesWrapper = dynamic(() => import('@/components/CategoriesWrapper'), {
  loading: () => (
    <div className="space-y-10 animate-pulse">
      <div className="h-12 w-64 bg-white/5 rounded"></div>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="h-32 bg-white/5 rounded-3xl"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-white/5 rounded-3xl"></div>
          ))}
        </div>
      </div>
    </div>
  )
});

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
