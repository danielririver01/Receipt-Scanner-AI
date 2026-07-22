'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FlaskAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {

    const flaskToken = searchParams.get('flask_token');
    if (!flaskToken) {
      setStatus('error');
      setTimeout(() => router.push('/sign-in'), 2000);
      return;
    }

    fetch('/api/auth/flask-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flask_token: flaskToken }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // Redirigir a Clerk sign-in con el ticket (autenticación automática)
        router.push(data.redirect_url);
      })
      .catch(() => {
        setStatus('error');
        setTimeout(() => router.push('/sign-in'), 2000);
      });
  }, [searchParams, router]);

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505] text-white">
        <div className="text-center">
          <p className="text-gray-400">Error de autenticación. Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050505] text-white">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Autenticando con Velzia...</p>
      </div>
    </div>
  );
}
