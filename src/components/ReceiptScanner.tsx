'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { processReceipt } from '@/actions/ocr';
import { saveExpense } from '@/actions/expenses';
import { Loader2, Upload, Check, X, Camera, Sparkles, AlertCircle, RefreshCcw, Send } from 'lucide-react';
import StatusModal, { ModalType } from './StatusModal';
import { motion, AnimatePresence } from 'framer-motion';

interface OCRResult {
  amount: number;
  merchant: string;
  date: string;
  category: string;
  description: string;
  ocrText: string;
  imageUrl: string;
}

type ScanStep = 'idle' | 'preview' | 'scanning' | 'editing';

export default function ReceiptScanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<ScanStep>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState('Iniciando motores de IA...');

  // Modal State
  const [modal, setModal] = useState<{
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

  const showModal = (type: ModalType, title: string, message: string) => {
    setModal({ isOpen: true, type, title, message });
  };

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'scan' && fileInputRef.current) {
      fileInputRef.current.click();
      const params = new URLSearchParams(searchParams.toString());
      params.delete('action');
      router.replace(`/dashboard?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, router]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStep('preview');
  };

  const startAnalysis = async () => {
    if (!selectedFile) return;
    
    setStep('scanning');
    setLoading(true);
    
    // Simular pasos de análisis para profesionalismo
    const statuses = [
      'Digitalizando imagen...',
      'Detectando bordes y texto...',
      'Analizando establecimiento...',
      'Extrayendo montos e impuestos...',
      'Clasificando categoría automáticamente...'
    ];
    
    let statusIdx = 0;
    const statusInterval = setInterval(() => {
      if (statusIdx < statuses.length - 1) {
        statusIdx++;
        setAnalysisStatus(statuses[statusIdx]);
      }
    }, 1500);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const data = await processReceipt(formData) as OCRResult;
      setResult(data);
      setStep('editing');
    } catch (error) {
      console.error('Error scanning receipt:', error);
      setStep('idle');
      showModal('error', 'Error de Escaneo', 'No pudimos procesar el ticket. Asegúrate de que sea una factura válida y legible.');
    } finally {
      clearInterval(statusInterval);
      setLoading(false);
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
      resetScanner();
      showModal('success', '¡Registrado!', 'El gasto se ha guardado correctamente.');
    } catch (error) {
      console.error('Error saving expense:', error);
      showModal('error', 'Error', 'No se pudo guardar el registro.');
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setStep('idle');
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
  };

  return (
    <div className="obsidian-card rounded-[2.5rem] p-1 md:p-1 overflow-hidden relative transition-all duration-500 border-white/5 bg-[#0a0a0a]">
      
      <div className="p-6 md:p-8">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: IDLE / SELECT */}
          {step === 'idle' && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-10 space-y-6"
            >
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full animate-pulse"></div>
                <div className="relative glass-container w-full h-full rounded-[2rem] flex items-center justify-center text-orange-500 shadow-2xl border-white/10">
                  <Camera className="w-10 h-10" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight text-white uppercase">Escáner IA Premium</h3>
                <p className="text-gray-500 text-xs max-w-[240px] mx-auto font-medium uppercase tracking-widest leading-relaxed">
                  Extracción inteligente de datos con precisión milimétrica.
                </p>
              </div>

              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
                id="receipt-upload"
                ref={fileInputRef}
              />
              <label
                htmlFor="receipt-upload"
                className="cursor-pointer inline-flex items-center justify-center w-full bg-white text-black font-black py-5 rounded-[1.5rem] transition-all hover:bg-orange-500 hover:text-white active:scale-95 shadow-xl shadow-white/5 uppercase tracking-widest text-xs"
              >
                <Upload className="w-4 h-4 mr-2" />
                Comenzar Captura
              </label>
            </motion.div>
          )}

          {/* STEP 2: PREVIEW & VALIDATION */}
          {step === 'preview' && (
            <motion.div 
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="relative aspect-[3/4] w-full max-w-[300px] mx-auto rounded-[2rem] overflow-hidden border-2 border-white/10 shadow-2xl">
                {previewUrl && <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <button 
                  onClick={resetScanner}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-red-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-2xl flex gap-3 items-start">
                <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={18} />
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Validación de Calidad</h4>
                  <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                    Asegúrate de que el ticket no esté borroso y la luz sea adecuada para evitar gastos innecesarios de tokens.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={resetScanner}
                  className="bg-white/5 text-gray-400 font-bold py-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-all uppercase tracking-widest text-[10px]"
                >
                  Repetir Foto
                </button>
                <button 
                  onClick={startAnalysis}
                  className="bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-600/20 hover:bg-orange-500 transition-all active:scale-95 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                >
                  <Sparkles size={14} />
                  Analizar con IA
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: SCANNING / ANALYSIS */}
          {step === 'scanning' && (
            <motion.div 
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 text-center space-y-8"
            >
              <div className="relative w-32 h-32 mx-auto">
                {/* AI Animation Circles */}
                <div className="absolute inset-0 border-4 border-orange-500/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-4 border-2 border-white/10 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="text-orange-500 w-10 h-10 animate-bounce" />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-1 w-1 bg-orange-500 rounded-full animate-ping"></div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Analizando Factura</h3>
                </div>
                <p className="text-orange-500 text-[11px] font-black uppercase tracking-[0.2em] animate-pulse">
                  {analysisStatus}
                </p>
              </div>

              <div className="w-full max-w-[200px] mx-auto bg-white/5 h-1.5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 8 }}
                  className="bg-orange-500 h-full"
                ></motion.div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: EDITING FORM */}
          {step === 'editing' && result && (
            <motion.div 
              key="editing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Revisión de IA</h3>
                  <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-1">Extracción completada</span>
                </div>
                <button onClick={resetScanner} className="p-2 bg-white/5 rounded-xl text-gray-500 hover:text-white transition-colors">
                  <RefreshCcw size={18} />
                </button>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Establecimiento</label>
                    <div className="relative group">
                      <input
                        type="text"
                        value={result.merchant}
                        onChange={(e) => setResult({ ...result, merchant: e.target.value })}
                        className="w-full bg-[#111] border border-white/5 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-orange-500/50 transition-all focus:bg-black"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Monto Total</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500 font-black">$</span>
                      <input
                        type="number"
                        value={result.amount}
                        onChange={(e) => setResult({ ...result, amount: parseFloat(e.target.value) })}
                        className="w-full bg-[#111] border border-white/5 rounded-2xl pl-10 pr-5 py-4 text-white font-black text-xl focus:outline-none focus:border-orange-500/50 transition-all focus:bg-black"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Categoría Inteligente</label>
                    <input
                      type="text"
                      value={result.category}
                      onChange={(e) => setResult({ ...result, category: e.target.value })}
                      className="w-full bg-[#111] border border-white/5 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-orange-500/50 transition-all focus:bg-black"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Fecha de Emisión</label>
                    <input
                      type="date"
                      value={result.date?.split('T')[0]}
                      onChange={(e) => setResult({ ...result, date: e.target.value })}
                      className="w-full bg-[#111] border border-white/5 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-orange-500/50 transition-all focus:bg-black [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:from-orange-500 hover:to-orange-400 transition-all shadow-xl shadow-orange-600/20 active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.15em] text-xs"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={16} />}
                Confirmar y Guardar Registro
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <StatusModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />
    </div>
  );
}

