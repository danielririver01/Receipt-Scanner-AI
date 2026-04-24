import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { createCategory, deleteCategory, setBudget } from "@/actions/categories";
import { Plus, Trash2, Save, Target, Tag as TagIcon } from 'lucide-react';

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

        {/* Categories List */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold px-2 flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-orange-500" />
            Gestión de Límites
          </h2>
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="obsidian-card rounded-3xl p-6 group">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl glass-container flex items-center justify-center text-gray-400 group-hover:text-orange-500 transition-colors">
                      <Target className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-lg text-white tracking-tight uppercase">{category.name}</span>
                  </div>
                  <form action={async () => {
                    'use server';
                    await deleteCategory(category.id);
                  }}>
                    <button className="p-2 text-gray-600 hover:text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </form>
                </div>

                <form action={async (formData) => {
                  'use server';
                  const amount = parseFloat(formData.get('amount') as string);
                  if (!isNaN(amount)) await setBudget(category.id, amount);
                }} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                  <div className="flex-1 w-full space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Presupuesto Mensual</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        name="amount"
                        step="0.01"
                        defaultValue={category.budgets[0]?.amount || ''}
                        placeholder="0.00"
                        className="w-full glass-container bg-transparent rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                      />
                    </div>
                  </div>
                  <button type="submit" className="sm:h-[50px] px-6 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold flex items-center gap-2 transition-colors border border-white/5">
                    <Save className="w-4 h-4" />
                    <span className="sm:hidden lg:inline">Guardar</span>
                  </button>
                </form>
              </div>
            ))}

            {categories.length === 0 && (
              <div className="glass-container rounded-[2rem] p-12 text-center text-gray-500 border-dashed border-white/10">
                <p className="italic font-light">No has creado categorías todavía.</p>
                <p className="text-sm mt-2">Comienza añadiendo una a la izquierda.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
