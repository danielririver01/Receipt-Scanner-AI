'use client';

import { useState } from 'react';
import { processReceipt } from '@/actions/ocr';
import { saveExpense } from '@/actions/expenses';
import { Loader2, Upload, Check } from 'lucide-react';

interface OCRResult {
  amount: number;
  merchant: string;
  date: string;
  category: string;
  description: string;
  ocrText: string;
  imageUrl: string;
}

export default function ReceiptScanner() {
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setScanning(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const data = await processReceipt(formData) as OCRResult;
      setResult(data);
    } catch (error) {
      console.error('Error scanning receipt:', error);
      alert('Error al escanear el ticket');
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setLoading(true);
    try {
      await saveExpense({
        amount: result.amount,
        description: result.merchant || result.description,
        date: result.date,
        categoryName: result.category,
        receiptUrl: result.imageUrl,
        ocrText: result.ocrText
      });
      setResult(null);
      alert('Gasto guardado con éxito');
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Error al guardar el gasto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md text-slate-900">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5" />
        Escanear Ticket
      </h2>

      {!result ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            id="receipt-upload"
            disabled={loading}
          />
          <label
            htmlFor="receipt-upload"
            className={`cursor-pointer inline-flex flex-col items-center ${loading ? 'opacity-50' : ''}`}
          >
            {loading ? (
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            ) : (
              <Upload className="w-12 h-12 text-gray-400" />
            )}
            <span className="mt-2 text-sm font-medium text-gray-600">
              {scanning ? 'Analizando con IA...' : 'Haz clic para subir o arrastra una imagen'}
            </span>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Comercio</label>
              <input
                type="text"
                value={result.merchant}
                onChange={(e) => setResult({ ...result, merchant: e.target.value })}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Monto</label>
              <input
                type="number"
                value={result.amount}
                onChange={(e) => setResult({ ...result, amount: parseFloat(e.target.value) })}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Categoría</label>
              <input
                type="text"
                value={result.category}
                onChange={(e) => setResult({ ...result, category: e.target.value })}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha</label>
              <input
                type="date"
                value={result.date?.split('T')[0]}
                onChange={(e) => setResult({ ...result, date: e.target.value })}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Confirmar y Guardar
            </button>
            <button
              onClick={() => setResult(null)}
              disabled={loading}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
