'use client';

import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  budget: { amount: number }[];
}

interface CategoryCardProps {
  category: Category;
  editingNameId: string | null;
  editingBudgetId: string | null;
  editName: string;
  editBudgetAmount: string;
  onNameEditStart: (category: Category) => void;
  onNameChange: (value: string) => void;
  onNameSave: (categoryId: string) => void;
  onNameCancel: () => void;
  onBudgetEditStart: (category: Category) => void;
  onBudgetChange: (value: string) => void;
  onBudgetSave: (categoryId: string) => void;
  onBudgetCancel: () => void;
  onDelete: (id: string) => void;
}

export default function CategoryCard({
  category,
  editingNameId,
  editingBudgetId,
  editName,
  editBudgetAmount,
  onNameEditStart,
  onNameChange,
  onNameSave,
  onNameCancel,
  onBudgetEditStart,
  onBudgetChange,
  onBudgetSave,
  onBudgetCancel,
  onDelete
}: CategoryCardProps) {
  const currentBudget = category.budget[0]?.amount;
  const isEditingName = editingNameId === category.id;
  const isEditingBudget = editingBudgetId === category.id;

  return (
    <div className="obsidian-card rounded-3xl p-6 group">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl glass-container flex items-center justify-center text-gray-400 group-hover:text-orange-500 transition-colors">
            <span className="text-lg">📁</span>
          </div>
          {isEditingName ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={editName}
                onChange={(e) => onNameChange(e.target.value)}
                className="glass-container bg-transparent rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500/50 flex-1"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && onNameSave(category.id)}
              />
              <button
                onClick={() => onNameSave(category.id)}
                className="p-2 text-green-500 hover:text-green-400"
              >
                <Check size={18} />
              </button>
              <button
                onClick={onNameCancel}
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
          {!isEditingName && (
            <button
              onClick={() => onNameEditStart(category)}
              className="p-2 text-gray-400 hover:text-orange-500 transition-colors"
            >
              <Pencil size={18} />
            </button>
          )}
          <button
            onClick={() => onDelete(category.id)}
            className="p-2 text-gray-600 hover:text-red-500 transition-colors"
          >
            <span className="text-lg">🗑️</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Presupuesto Mensual</span>
          {isEditingBudget ? (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-gray-400">$</span>
              <input
                type="number"
                step="0.01"
                value={editBudgetAmount}
                onChange={(e) => onBudgetChange(e.target.value)}
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
        
        {isEditingBudget ? (
          <div className="flex gap-2">
            <button
              onClick={() => onBudgetSave(category.id)}
              className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors"
            >
              <Check size={18} />
            </button>
            <button
              onClick={onBudgetCancel}
              className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onBudgetEditStart(category)}
            className="p-2 text-gray-500 hover:text-orange-500 transition-colors"
          >
            <Pencil size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
