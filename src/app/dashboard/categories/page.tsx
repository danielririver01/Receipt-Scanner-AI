import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { createCategory, deleteCategory, setBudget } from "@/actions/categories";

export default async function CategoriesPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const categories = await prisma.category.findMany({
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
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Categorías y Presupuestos</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Nueva Categoría</h2>
          <form action={async (formData) => {
            'use server';
            const name = formData.get('name') as string;
            if (name) await createCategory(name);
          }} className="flex gap-2">
            <input
              type="text"
              name="name"
              placeholder="Ej: Alimentos, Transporte..."
              className="flex-1 border rounded px-3 py-2"
              required
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Añadir
            </button>
          </form>
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Mis Categorías</h2>
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="border-b pb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-lg text-slate-900">{category.name}</span>
                  <form action={async () => {
                    'use server';
                    await deleteCategory(category.id);
                  }}>
                    <button className="text-red-600 hover:text-red-800 text-sm">Eliminar</button>
                  </form>
                </div>

                <form action={async (formData) => {
                  'use server';
                  const amount = parseFloat(formData.get('amount') as string);
                  if (!isNaN(amount)) await setBudget(category.id, amount);
                }} className="flex gap-2 items-center">
                  <label className="text-sm text-gray-600">Presupuesto:</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    defaultValue={category.budget[0]?.amount || ''}
                    placeholder="0.00"
                    className="w-24 border rounded px-2 py-1 text-sm text-slate-900"
                  />
                  <button type="submit" className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">
                    Guardar
                  </button>
                </form>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-gray-500 italic">No has creado categorías todavía.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
