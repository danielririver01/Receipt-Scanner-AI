'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Trash2, Plus, Minus, ImageIcon, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { updateExpense, deleteExpense } from '@/actions/expenses';

interface Item {
  name: string;
  price: number;
}

interface Expense {
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
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

const CATEGORIES = [
  'Alimentos', 'Bebidas', 'Transporte', 'Hostelería', 'Suministros',
  'Mantenimiento', 'Servicios', 'Equipos', 'Marketing', 'Otros'
];

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
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    if (expense) {
      setForm({
        description: expense.description,
        amount: expense.amount.toString(),
        date: new Date(expense.date).toISOString().split('T')[0],
        categoryName: expense.category.name
      });
      setShowDeleteConfirm(false);
      setShowImage(false);
      
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

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.price || 0), 0);
  };

  const isLowConfidence = (confidence: number | null | undefined) => {
    return confidence !== null && confidence !== undefined && confidence < 0.8;
  };

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
    setItems([...items, { name: '', price: 0 }]);
  };

  const updateItem = (index: number, field: 'name' | 'price', value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
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
            {/* Receipt Image Section - Desktop: Left side, Mobile: Hidden/Toggle */}
            <div className="hidden md:flex md:w-1/3 flex-col">
              <div className="obsidian-card rounded-3xl p-4 border border-white/10 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Original</h3>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {expense.receiptUrl ? (
                  <div className="flex-1 rounded-2xl overflow-hidden bg-black/50">
                    <img 
                      src={expense.receiptUrl} 
                      alt="Receipt" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex-1 rounded-2xl bg-black/50 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Sin imagen</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Form Section - Right side */}
            <div className="flex-1 obsidian-card rounded-3xl p-6 border border-white/10 overflow-y-auto">
              {/* Mobile: Image toggle button */}
              <div className="md:hidden mb-4">
                <button
                  onClick={() => setShowImage(!showImage)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-300 font-bold text-sm hover:bg-white/10 transition-all"
                >
                  {showImage ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showImage ? 'Ocultar' : 'Ver'} Original
                </button>
                {showImage && expense.receiptUrl && (
                  <div className="mt-4 rounded-2xl overflow-hidden">
                    <img 
                      src={expense.receiptUrl} 
                      alt="Receipt" 
                      className="w-full h-auto max-h-48 object-contain bg-black/50"
                    />
                  </div>
                )}
              </div>

              {/* Desktop: Close button in header */}
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
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        className={`w-full bg-white/5 border rounded-2xl pl-10 pr-4 py-3.5 text-white font-bold focus:outline-none focus:border-orange-500/50 transition-all ${
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

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowItems(!showItems)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-300">
                        Productos ({items.length})
                      </span>
                      {isLowConfidence(expense.itemsConfidence) && (
                        <span className="text-[10px] text-orange-500 font-bold">
                          ⚠️ Revisar suma
                        </span>
                      )}
                    </div>
                    <span className={`text-orange-500 transition-transform ${showItems ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>

                  <AnimatePresence>
                    {showItems && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-2 overflow-hidden"
                      >
                        {items.map((item, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-white/5 rounded-xl">
                            <input
                              type="text"
                              placeholder="Producto"
                              value={item.name}
                              onChange={(e) => updateItem(index, 'name', e.target.value)}
                              className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none placeholder:text-gray-600"
                            />
                            <div className="flex items-center gap-1">
                              <span className="text-gray-500 text-xs">$</span>
                              <input
                                type="number"
                                placeholder="0"
                                value={item.price || ''}
                                onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                                className="w-20 bg-white/5 rounded-lg px-2 py-1 text-white text-sm font-bold text-right focus:outline-none focus:border-orange-500/50"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-all"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={addItem}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-dashed border-orange-500/30 text-orange-500 text-sm font-bold hover:bg-orange-500/10 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          Agregar Producto
                        </button>

                        {items.length > 0 && (
                          <div className="flex justify-between text-sm pt-2 border-t border-white/5">
                            <span className="text-gray-500">Suma de productos:</span>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${
                                isLowConfidence(expense.itemsConfidence) 
                                  ? 'text-orange-500' 
                                  : 'text-orange-500'
                              }`}>
                                ${calculateTotal().toLocaleString('es-CO')}
                              </span>
                              {Math.abs(calculateTotal() - parseFloat(form.amount || '0')) > 100 && (
                                <span className="text-xs text-orange-500">≠ total</span>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

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

              <AnimatePresence>
                {showDeleteConfirm && (
                  <motion.div
                    className="absolute inset-0 rounded-3xl bg-black/90 flex flex-col items-center justify-center p-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                      <Trash2 className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">¿Eliminar gasto?</h3>
                    <p className="text-gray-400 text-sm text-center mb-6">
                      Esta acción no se puede deshacer.
                    </p>
                    <div className="flex gap-3 w-full">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 px-5 py-3 rounded-2xl bg-white/5 text-gray-400 font-bold text-sm hover:bg-white/10 transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="flex-1 px-5 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Eliminar'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}