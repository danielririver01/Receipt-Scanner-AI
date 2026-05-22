'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { updateExpense, deleteExpense } from '@/actions/expenses';
import { Item } from '@/types';
import ReceiptImageViewer from './edit-expense/ReceiptImageViewer';
import ItemListEditor from './edit-expense/ItemListEditor';
import DeleteConfirmationOverlay from './edit-expense/DeleteConfirmationOverlay';

interface EditExpense {
  id: string;
  description: string;
  date: Date;
  amount: number;
  amountConfidence: number | null;
  category: { name: string };
  receiptUrl: string | null;
  items: string | null;
  itemsConfidence: number | null;
}

interface EditExpenseModalProps {
  expense: EditExpense | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

const CATEGORIES = [
  'Alimentos', 'Bebidas', 'Transporte', 'Hostelería', 'Suministros',
  'Mantenimiento', 'Servicios', 'Equipos', 'Marketing', 'Otros'
];

function isLowConfidence(confidence: number | null | undefined): boolean {
  return confidence !== null && confidence !== undefined && confidence < 0.8;
}

export default function EditExpenseModal({
  expense,
  isOpen,
  onClose,
  onUpdated,
  onDeleted
}: EditExpenseModalProps) {
  const [form, setForm] = useState({
    description: '',
    amount: '',
    date: '',
    categoryName: ''
  });
  const [items, setItems] = useState<Item[]>([]);
  const [showItems, setShowItems] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (expense) {
      setForm({
        description: expense.description,
        amount: expense.amount.toString(),
        date: new Date(expense.date).toISOString().split('T')[0],
        categoryName: expense.category.name
      });
      setShowDeleteConfirm(false);
      
      if (expense.items) {
        try {
          const parsedItems = JSON.parse(expense.items);
          setItems(parsedItems);
        } catch {
          setItems([]);
        }
      } else {
        setItems([]);
      }
    }
  }, [expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense) return;

    setLoading(true);
    try {
      await updateExpense({
        id: expense.id,
        description: form.description,
        amount: parseFloat(form.amount),
        date: form.date,
        categoryName: form.categoryName,
        items: items.length > 0 ? JSON.stringify(items) : undefined,
      });
      onUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!expense) return;

    setLoading(true);
    try {
      await deleteExpense(expense.id);
      onDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    const newItems = [...items, { name: '', price: 0 }];
    setItems(newItems);
    const newTotal = newItems.reduce((sum, item) => sum + (item.price || 0), 0);
    setForm(prev => ({ ...prev, amount: newTotal.toString() }));
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    const newTotal = newItems.reduce((sum, item) => sum + (item.price || 0), 0);
    setForm(prev => ({ ...prev, amount: newTotal.toString() }));
  };

  const updateItem = (index: number, field: 'name' | 'price', value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);

    const newTotal = newItems.reduce((sum, item) => sum + (item.price || 0), 0);
    setForm(prev => ({ ...prev, amount: newTotal.toString() }));
  };

  return (
    <AnimatePresence>
      {isOpen && expense && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[90vw] md:max-w-5xl z-50 max-h-[90vh] overflow-hidden flex flex-col md:flex-row gap-4"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <ReceiptImageViewer
              receiptUrl={expense.receiptUrl}
              onClose={onClose}
            />

            <div className="flex-1 obsidian-card rounded-3xl p-6 border border-white/10 overflow-y-auto relative">
              <div className="hidden md:flex items-center justify-between mb-6">
                <h2 className="text-xl font-black tracking-tight">
                  <span className="accent-text">Editar</span> Gasto
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500 ml-1">
                    Establecimiento
                  </label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white font-medium focus:outline-none focus:border-orange-500/50 transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500 ml-1">
                        Total
                      </label>
                      {isLowConfidence(expense.amountConfidence) && (
                        <span className="text-[10px] text-orange-500 font-bold flex items-center gap-1">
                          ⚠️ Revisar
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 font-bold">$</span>
                      <input
                        type="number"
                        value={form.amount}
                        readOnly
                        className={`w-full bg-white/5 border rounded-2xl pl-10 pr-4 py-3.5 text-white font-bold focus:outline-none transition-all ${
                          isLowConfidence(expense.amountConfidence) 
                            ? 'border-orange-500/50 bg-orange-500/5' 
                            : 'border-white/10'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500 ml-1">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white font-medium focus:outline-none focus:border-orange-500/50 transition-all [color-scheme:dark]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-[0.15em] text-gray-500 ml-1">
                    Categoría
                  </label>
                  <select
                    value={form.categoryName}
                    onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl px-4 py-3.5 text-white font-medium focus:outline-none focus:border-orange-500/50 transition-all appearance-none cursor-pointer"
                    required
                  >
                    <option value="" disabled className="bg-[#1a1a1a] text-gray-400">Seleccionar categoría</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-[#1a1a1a] text-white">{cat}</option>
                    ))}
                  </select>
                </div>

                <ItemListEditor
                  items={items}
                  totalAmount={form.amount}
                  itemsConfidence={expense.itemsConfidence}
                  showItems={showItems}
                  onToggle={() => setShowItems(!showItems)}
                  onAddItem={addItem}
                  onUpdateItem={updateItem}
                  onRemoveItem={removeItem}
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-5 py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-sm hover:bg-red-500/20 transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>

                  <div className="flex-1 flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-5 py-3.5 rounded-2xl bg-white/5 text-gray-400 font-bold text-sm hover:bg-white/10 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold text-sm hover:from-orange-500 hover:to-orange-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
                    </button>
                  </div>
                </div>
              </form>

              <DeleteConfirmationOverlay
                isOpen={showDeleteConfirm}
                loading={loading}
                onCancel={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
