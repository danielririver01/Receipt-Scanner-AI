import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Plus } from 'lucide-react';
import CategoryManager from "@/components/CategoryManager";
import CategoryForm from "@/components/CategoryForm";

export default async function CategoriesPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const categories = await prisma.category.findMany({
    where: { userId },
    include: {
      budgets: {
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

      <div className="grid gap-8 lg:grid-cols-2">
        {/* New Category Form */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold px-2 flex items-center gap-2">
            <Plus className="w-5 h-5 text-orange-500" />
            Nueva Categoría
          </h2>
          <CategoryForm />
        </section>

        {/* Categories List (Managed by Client Component) */}
        <CategoryManager initialCategories={categories} />
      </div>
    </div>
  );
}
