'use client';

import { useState } from 'react';
import { createCategory, deleteCategory, setBudget, updateCategory } from '@/actions/categories';
import CategoryForm from './CategoryForm';
import DeleteModal from './DeleteModal';
import StatusModal, { ModalType } from './StatusModal';
import { ChevronDown, ChevronUp, Pencil, Check, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  budget: {
    amount: number;
  }[];
}

const INITIAL_DISPLAY = 5;

export default function CategoriesWrapper({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [showAll, setShowAll] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const displayedCategories = showAll ? categories : categories.slice(0, INITIAL_DISPLAY);
  const hasMore = categories.length > INITIAL_DISPLAY;

  const showStatus = (type: ModalType, title: string, message: string) => {
    setStatusModal({ isOpen: true, type, title, message });
  };

  const handleCreateCategory = async (name: string) => {
    try {
      const newCategory = await createCategory(name);
      setCategories(prev => [...prev, { ...newCategory, budget: [] }]);
      showStatus('success', '¡Creada!', `La categoría "${name}" ha sido creada.`);
    } catch (error) {
      console.error("Error creating category:", error);
      showStatus('error', 'Error', 'No se pudo crear la categoría.');
    }
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
      showStatus('error', 'Error', 'No se pudo eliminar la categoría.');
    } finally {
      setIsDeleting(false);
      setCategoryToDelete(null);
    }
  };

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditAmount(category.budget[0]?.amount?.toString() || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditAmount('');
  };

  const handleUpdateBudget = async (categoryId: string) => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount)) return;
    
    try {
      await setBudget(categoryId, amount);
      setCategories(prev => prev.map(c => 
        c.id === categoryId 
          ? { ...c, budget: [{ amount }] }
          : c
      ));
      setEditingId(null);
      setEditAmount('');
      showStatus('success', '¡Guardado!', 'El presupuesto se ha actualizado correctamente.');
    } catch (error) {
      console.error("Error updating budget:", error);
      showStatus('error', 'Error', 'No se pudo actualizar el presupuesto.');
    }
  };

  const startEditingName = (category: Category) => {
    setEditingNameId(category.id);
    setEditName(category.name);
  };

  const cancelEditingName = () => {
    setEditingNameId(null);
    setEditName('');
  };

  const handleUpdateName = async (categoryId: string) => {
    if (!editName.trim()) return;
    try {
      await updateCategory(categoryId, editName.trim());
      setCategories(prev => prev.map(c => 
        c.id === categoryId 
          ? { ...c, name: editName.trim() }
          : c
      ));
      setEditingNameId(null);
      setEditName('');
      showStatus('success', '¡Guardado!', 'La categoría ha sido actualizada.');
    } catch (error) {
      console.error("Error updating category:", error);
      showStatus('error', 'Error', 'No se pudo actualizar la categoría.');
    }
  };

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="text-xl font-bold px-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-500 text-xs font-bold">+</span>
            Nueva Categoría
          </h2>
          <CategoryForm onSubmit={handleCreateCategory} />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold px-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-xs font-bold">≡</span>
            Gestión de Categorías
            <span className="text-xs text-gray-500 font-normal">({categories.length})</span>
          </h2>
          <div className="space-y-4">
            {displayedCategories.map((category) => {
              const currentBudget = category.budget[0]?.amount;
              const isEditing = editingId === category.id;

              return (
                <div key={category.id} className="obsidian-card rounded-3xl p-6 group">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-xl glass-container flex items-center justify-center text-gray-400 group-hover:text-orange-500 transition-colors">
                        <span className="text-lg">📁</span>
                      </div>
                      {editingNameId === category.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="glass-container bg-transparent rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500/50 flex-1"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateName(category.id)}
                          />
                          <button
                            onClick={() => handleUpdateName(category.id)}
                            className="p-2 text-green-500 hover:text-green-400"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={cancelEditingName}
                            className="p-2 text-gray-500 hover:text-gray-400"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <span className="font-bold text-lg text-white tracking-tight uppercase">{category.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingNameId !== category.id && (
                        <button
                          onClick={() => startEditingName(category)}
                          className="p-2 text-gray-400 hover:text-orange-500 transition-colors"
                        >
                          <Pencil size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteClick(category.id)}
                        className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                      >
                        <span className="text-lg">🗑️</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Presupuesto Mensual</span>
                      {isEditing ? (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-gray-400">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="bg-transparent border-b border-orange-500 text-white font-bold w-24 focus:outline-none"
                            autoFocus
                          />
                        </div>
                      ) : currentBudget ? (
                        <p className="text-emerald-400 font-black text-xl mt-1">$ {currentBudget.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} COP</p>
                      ) : (
                        <p className="text-gray-500 font-medium mt-1">Sin presupuesto</p>
                      )}
                    </div>
                    
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateBudget(category.id)}
                          className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(category)}
                        className="p-2 text-gray-500 hover:text-orange-500 transition-colors"
                      >
                        <Pencil size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {categories.length === 0 && (
              <div className="glass-container rounded-[2rem] p-12 text-center text-gray-500 border-dashed border-white/10">
                <p className="italic font-light">No has creado categorías todavía.</p>
                <p className="text-sm mt-2">Comienza añadiendo una a la izquierda.</p>
              </div>
            )}

            {hasMore && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full py-3 text-center text-orange-500 font-bold text-sm hover:text-orange-400 transition-colors flex items-center justify-center gap-2"
              >
                {showAll ? (
                  <>Ver menos <ChevronUp size={16} /></>
                ) : (
                  <>Ver más ({categories.length - INITIAL_DISPLAY}) <ChevronDown size={16} /></>
                )}
              </button>
            )}
          </div>
        </section>
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
    </>
  );
}