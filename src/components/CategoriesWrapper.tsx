'use client';

import { useState } from 'react';
import { createCategory, deleteCategory, setBudget, updateCategory } from '@/actions/categories';
import CategoryForm from './CategoryForm';
import DeleteModal from './DeleteModal';
import StatusModal, { ModalType } from './StatusModal';
import { ChevronDown, ChevronUp } from 'lucide-react';
import CategoryCard from './categories/CategoryCard';

interface Category {
  id: string;
  name: string;
  budget: { amount: number }[];
}

const INITIAL_DISPLAY = 5;

export default function CategoriesWrapper({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [showAll, setShowAll] = useState(false);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editBudgetAmount, setEditBudgetAmount] = useState('');
  
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

  const startEditingBudget = (category: Category) => {
    setEditingBudgetId(category.id);
    setEditBudgetAmount(category.budget[0]?.amount?.toString() || '');
  };

  const cancelEditingBudget = () => {
    setEditingBudgetId(null);
    setEditBudgetAmount('');
  };

  const handleUpdateBudget = async (categoryId: string) => {
    const amount = parseFloat(editBudgetAmount);
    if (isNaN(amount)) return;
    
    try {
      await setBudget(categoryId, amount);
      setCategories(prev => prev.map(c => 
        c.id === categoryId 
          ? { ...c, budget: [{ amount }] }
          : c
      ));
      setEditingBudgetId(null);
      setEditBudgetAmount('');
      showStatus('success', '¡Guardado!', 'El presupuesto se ha actualizado correctamente.');
    } catch (error) {
      console.error("Error updating budget:", error);
      showStatus('error', 'Error', 'No se pudo actualizar el presupuesto.');
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
            {displayedCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                editingNameId={editingNameId}
                editingBudgetId={editingBudgetId}
                editName={editName}
                editBudgetAmount={editBudgetAmount}
                onNameEditStart={startEditingName}
                onNameChange={setEditName}
                onNameSave={handleUpdateName}
                onNameCancel={cancelEditingName}
                onBudgetEditStart={startEditingBudget}
                onBudgetChange={setEditBudgetAmount}
                onBudgetSave={handleUpdateBudget}
                onBudgetCancel={cancelEditingBudget}
                onDelete={handleDeleteClick}
              />
            ))}

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
