'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useSignIn } from '@clerk/nextjs';

export default function FlaskAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();
  const { isLoaded: signInLoaded, signIn } = useSignIn();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    if (!isLoaded || !signInLoaded) return;

    if (isSignedIn) {
      router.push('/dashboard');
      return;
    }

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

        const result = await signIn.create({
          identifier: data.email,
          strategy: 'email_code',
        });

        router.push(`/sign-in?redirect_url=/dashboard&email=${encodeURIComponent(data.email)}`);
      })
      .catch(() => {
        setStatus('error');
        setTimeout(() => router.push('/sign-in'), 2000);
      });
  }, [isLoaded, isSignedIn, signInLoaded, signIn, searchParams, router]);

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
