import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { createCategory } from "@/actions/categories";
import { Plus } from 'lucide-react';
import CategoryManager from "@/components/CategoryManager";

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
          <div className="obsidian-card rounded-[2rem] p-8">
            <form action={async (formData) => {
              'use server';
              const name = formData.get('name') as string;
              if (name) await createCategory(name);
            }} className="flex flex-col gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Nombre de la Categoría</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Ej: Insumos, Bebidas, Alquiler..."
                  className="w-full glass-container bg-transparent rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-orange-500 hover:text-white transition-all active:scale-95">
                Crear Categoría
              </button>
            </form>
          </div>
        </section>

        {/* Categories List (Managed by Client Component) */}
        <CategoryManager initialCategories={categories} />
      </div>
    </div>
  );
}
