'use client';

import React, { useState } from 'react';
import { Trash2, Save, Target, Tag as TagIcon } from 'lucide-react';
import { deleteCategory, setBudget } from "@/actions/categories";
import DeleteModal from './DeleteModal';
import StatusModal, { ModalType } from './StatusModal';

interface Category {
  id: string;
  name: string;
  budgets: {
    amount: number;
  }[];
}

interface CategoryManagerProps {
  initialCategories: Category[];
}

export default function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status Modal State
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const showStatus = (type: ModalType, title: string, message: string) => {
    setStatusModal({ isOpen: true, type, title, message });
  };

  const handleDeleteClick = (id: string) => {
    setCategoryToDelete(id);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCategory(categoryToDelete);
      setCategories(prev => prev.filter(c => c.id !== categoryToDelete));
      setIsModalOpen(false);
      showStatus('success', 'Eliminado', 'La categoría ha sido eliminada correctamente.');
    } catch (error) {
      console.error("Error deleting category:", error);
      showStatus('error', 'Error', 'No se pudo eliminar la categoría. Inténtalo de nuevo.');
    } finally {
      setIsDeleting(false);
      setCategoryToDelete(null);
    }
  };

  const handleUpdateBudget = async (id: string, amount: number) => {
    try {
      await setBudget(id, amount);
      showStatus('success', '¡Guardado!', 'El presupuesto se ha actualizado correctamente.');
    } catch (error) {
      console.error("Error updating budget:", error);
      showStatus('error', 'Error', 'No se pudo actualizar el presupuesto.');
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold px-2 flex items-center gap-2">
        <TagIcon className="w-5 h-5 text-orange-500" />
        Gestión de Categorías
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
              <button 
                onClick={() => handleDeleteClick(category.id)}
                className="p-2 text-gray-600 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <form action={async (formData) => {
              const amount = parseFloat(formData.get('amount') as string);
              if (!isNaN(amount)) await handleUpdateBudget(category.id, amount);
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

      <DeleteModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        loading={isDeleting}
        title="Eliminar Categoría"
        message="¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer y afectará a los presupuestos asociados."
      />

      <StatusModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
      />
    </section>
  );
}
