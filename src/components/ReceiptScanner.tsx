'use client';

import { useState } from 'react';
import { processReceipt } from '@/actions/ocr';
import { saveExpense } from '@/actions/expenses';
import { Loader2, Upload, Check, X, Camera } from 'lucide-react';

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
    <div className="obsidian-card rounded-3xl p-6 md:p-8 overflow-hidden relative group transition-all duration-500 hover:border-orange-500/20">
      {!result ? (
        <div className="text-center space-y-6">
          <div className="glass-container w-24 h-24 mx-auto rounded-[2rem] flex items-center justify-center text-orange-500 shadow-xl shadow-orange-500/10 group-hover:scale-110 transition-transform duration-500">
            <Camera className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight">Capturar Ticket</h3>
            <p className="text-gray-500 text-sm max-w-[200px] mx-auto">Sube una foto de tu factura para extraer los datos automáticamente.</p>
          </div>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleUpload}
            className="hidden"
            id="receipt-upload"
            disabled={loading}
          />
          <label
            htmlFor="receipt-upload"
            className={`cursor-pointer inline-flex items-center justify-center w-full bg-white text-black font-bold py-4 rounded-2xl transition-all duration-300 hover:bg-orange-500 hover:text-white active:scale-95 ${loading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                {scanning ? 'Procesando...' : 'Seleccionar Imagen'}
              </span>
            )}
          </label>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Datos Extraídos</h3>
            <button onClick={() => setResult(null)} className="text-gray-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Establecimiento</label>
              <input
                type="text"
                value={result.merchant}
                onChange={(e) => setResult({ ...result, merchant: e.target.value })}
                className="w-full glass-container bg-transparent rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Monto Total</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={result.amount}
                  onChange={(e) => setResult({ ...result, amount: parseFloat(e.target.value) })}
                  className="w-full glass-container bg-transparent rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Categoría</label>
              <input
                type="text"
                value={result.category}
                onChange={(e) => setResult({ ...result, category: e.target.value })}
                className="w-full glass-container bg-transparent rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Fecha</label>
              <input
                type="date"
                value={result.date?.split('T')[0]}
                onChange={(e) => setResult({ ...result, date: e.target.value })}
                className="w-full glass-container bg-transparent rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors [color-scheme:dark]"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            Confirmar Gasto
          </button>
        </div>
      )}

      {/* Scan Line Animation during loading */}
      {scanning && (
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-3xl">
          <div className="scan-line"></div>
        </div>
      )}
    </div>
  );
}
