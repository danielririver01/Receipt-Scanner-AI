'use client';

import { useRef, useState } from 'react';
import { createCategory } from "@/actions/categories";
import { Loader2 } from 'lucide-react';

export default function CategoryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    const name = formData.get('name') as string;
    if (!name) return;

    setLoading(true);
    try {
      await createCategory(name);
      formRef.current?.reset();
    } catch (error) {
      console.error("Error creating category:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="obsidian-card rounded-[2rem] p-8">
      <form
        ref={formRef}
        action={handleSubmit}
        className="flex flex-col gap-4"
      >
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
            Nombre de la Categoría
          </label>
          <input
            type="text"
            name="name"
            placeholder="Ej: Insumos, Bebidas, Alquiler..."
            className="w-full glass-container bg-transparent rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-orange-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Crear Categoría
        </button>
      </form>
    </div>
  );
}
