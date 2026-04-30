'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SignInButton, UserButton } from '@clerk/nextjs';
import { Menu, X } from 'lucide-react';

interface LandingHeaderProps {
  userId: string | null;
}

export default function LandingHeader({ userId }: LandingHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: 'Productos', href: '#features' },
    { name: 'Precios', href: 'https://www.velzia.co/planes' },
    { name: 'Términos', href: 'https://www.velzia.co/terms' },
  ];

  return (
    <header className="sticky top-0 w-full bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 z-50">
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-black text-xl transition-transform group-hover:scale-110">
            V
          </div>
          <span className="text-2xl font-bold tracking-tighter text-white">VELZIA</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-10">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              {item.name}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6">
          {userId ? (
            <Link
              href="/dashboard"
              className="hidden md:block bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-orange-500 hover:text-white transition-all duration-300"
            >
              Ir al Dashboard
            </Link>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="hidden md:block text-sm font-medium text-gray-400 hover:text-white cursor-pointer">
                  Iniciar sesión
                </button>
              </SignInButton>
              <Link
                href="https://www.velzia.co/register?plan=trial"
                className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-orange-500 hover:text-white transition-all duration-300"
              >
                Comienza gratis
              </Link>
            </>
          )}

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-[#0a0a0a] border-b border-white/5 py-8 px-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col gap-6">
            {navigation.map((item) => (
              <Link 
                key={item.name} 
                href={item.href} 
                onClick={() => setIsMenuOpen(false)}
                className="text-lg font-bold text-gray-400 hover:text-white"
              >
                {item.name}
              </Link>
            ))}
            <hr className="border-white/5" />
            {userId ? (
              <Link
                href="/dashboard"
                className="text-lg font-bold text-orange-500"
              >
                Ir al Dashboard
              </Link>
            ) : (
              <SignInButton mode="modal">
                <button className="text-lg font-bold text-gray-400 hover:text-white text-left">
                  Iniciar sesión
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
