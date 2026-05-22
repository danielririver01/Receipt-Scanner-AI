import { Suspense } from 'react';
import FlaskAuthContent from './FlaskAuthContent';

export default function FlaskAuthPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#050505] text-white">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    }>
      <FlaskAuthContent />
    </Suspense>
  );
}
