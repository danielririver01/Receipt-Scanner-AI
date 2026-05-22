'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { processReceipt } from '@/actions/ocr';
import { saveExpense } from '@/actions/expenses';
import StatusModal, { ModalType } from './StatusModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Item, OCRResult } from '@/types';
import ScannerIdle from './receipt-scanner/ScannerIdle';
import ScannerPreview from './receipt-scanner/ScannerPreview';
import ScannerAnalyzing from './receipt-scanner/ScannerAnalyzing';
import ScannerReview from './receipt-scanner/ScannerReview';

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
  const [analysisStatus, setAnalysisStatus] = useState('Iniciando análisis...');

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
        ocrText: result.ocrText,
        items: result.items && result.items.length > 0 ? JSON.stringify(result.items) : undefined,
        amountConfidence: result.amountConfidence,
        itemsConfidence: result.itemsConfidence
      });
      resetScanner();
      showModal('success', '¡Registrado!', 'El gasto se ha guardado correctamente.');
      setTimeout(() => router.refresh(), 500);
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

  const handleUpdateResult = (updates: Partial<OCRResult>) => {
    if (result) {
      setResult({ ...result, ...updates });
    }
  };

  return (
    <div className="obsidian-card rounded-[2.5rem] p-1 md:p-1 overflow-hidden relative transition-all duration-500 border-white/5" style={{ background: 'var(--color-surface-primary)' }}>
      
      <div className="p-6 md:p-8">
        <AnimatePresence mode="wait">
          
          {step === 'idle' && (
            <ScannerIdle 
              fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>} 
              onChange={handleFileSelect}
            />
          )}

          {step === 'preview' && (
            <ScannerPreview
              previewUrl={previewUrl}
              onReset={resetScanner}
              onAnalyze={startAnalysis}
            />
          )}

          {step === 'scanning' && (
            <ScannerAnalyzing analysisStatus={analysisStatus} />
          )}

          {step === 'editing' && result && (
            <ScannerReview
              result={result}
              loading={loading}
              onUpdateResult={handleUpdateResult}
              onSave={handleSave}
              onReset={resetScanner}
            />
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
