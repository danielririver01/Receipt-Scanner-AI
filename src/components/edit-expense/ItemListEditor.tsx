'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

interface Item {
  name: string;
  price: number;
}

interface ItemListEditorProps {
  items: Item[];
  totalAmount: string;
  itemsConfidence: number | null;
  showItems: boolean;
  onToggle: () => void;
  onAddItem: () => void;
  onUpdateItem: (index: number, field: 'name' | 'price', value: string | number) => void;
  onRemoveItem: (index: number) => void;
}

function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + (item.price || 0), 0);
}

function isLowConfidence(confidence: number | null | undefined): boolean {
  return confidence !== null && confidence !== undefined && confidence < 0.8;
}

export default function ItemListEditor({
  items,
  totalAmount,
  itemsConfidence,
  showItems,
  onToggle,
  onAddItem,
  onUpdateItem,
  onRemoveItem
}: ItemListEditorProps) {
  const total = calculateTotal(items);
  const amountDiff = Math.abs(total - parseFloat(totalAmount || '0'));

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-300">
            Productos ({items.length})
          </span>
          {isLowConfidence(itemsConfidence) && (
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
                  onChange={(e) => onUpdateItem(index, 'name', e.target.value)}
                  className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none placeholder:text-gray-600"
                />
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 text-xs">$</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={item.price || ''}
                    onChange={(e) => {
  const val = e.target.value.replace(/\./g, '').replace(',', '.');
  onUpdateItem(index, 'price', parseFloat(val) || 0);
}}
                    className="w-20 bg-white/5 rounded-lg px-2 py-1 text-white text-sm font-bold text-right focus:outline-none focus:border-orange-500/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveItem(index)}
                  className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={onAddItem}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-dashed border-orange-500/30 text-orange-500 text-sm font-bold hover:bg-orange-500/10 transition-all"
            >
              <Plus className="w-4 h-4" />
              Agregar Producto
            </button>

            {items.length > 0 && (
              <div className="flex justify-between text-sm pt-2 border-t border-white/5">
                <span className="text-gray-500">Suma de productos:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-orange-500">
                    ${total.toLocaleString('es-CO')}
                  </span>
                  {amountDiff > 100 && (
                    <span className="text-xs text-orange-500">≠ total</span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
