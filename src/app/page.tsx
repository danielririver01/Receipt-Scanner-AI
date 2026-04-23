import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { ArrowRight, Receipt, PieChart, ShieldCheck } from 'lucide-react';

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <header className="bg-white border-b">
        <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <Receipt className="w-6 h-6" />
            <span>SmartExpense OCR</span>
          </div>
          <div>
            {userId ? (
              <Link href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                Ir al Dashboard
              </Link>
            ) : (
              <div className="flex gap-4">
                <Link href="/sign-in" className="text-slate-600 hover:text-slate-900 px-4 py-2">
                  Iniciar Sesión
                </Link>
                <Link href="/sign-up" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      <main>
        <section className="py-20 px-4 text-center bg-gradient-to-b from-blue-50 to-white">
          <h1 className="text-5xl font-extrabold text-slate-900 mb-6">
            Gestiona tus gastos con el <span className="text-blue-600">poder de la IA</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
            Escanea tus tickets, categoriza automáticamente tus gastos y mantén tu presupuesto bajo control sin esfuerzo manual.
          </p>
          <Link 
            href={userId ? "/dashboard" : "/sign-up"} 
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
          >
            Empezar Gratis <ArrowRight className="w-5 h-5" />
          </Link>
        </section>

        <section className="py-20 max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
              <Receipt className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-slate-900">OCR con GPT-4o</h3>
            <p className="text-slate-600">Sube una foto de tu ticket y deja que nuestra IA extraiga el monto, comercio y fecha con precisión.</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-green-600">
              <PieChart className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-slate-900">Categorización Inteligente</h3>
            <p className="text-slate-600">El sistema asigna automáticamente cada gasto a su categoría correspondiente para que no pierdas tiempo.</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-purple-600">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-4 text-slate-900">Presupuestos y Alertas</h3>
            <p className="text-slate-600">Define límites mensuales y recibe alertas visuales cuando estés por superar tus metas de ahorro.</p>
          </div>
        </section>
      </main>

      <footer className="bg-slate-50 border-t py-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500">
          <p>© 2024 SmartExpense OCR. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
