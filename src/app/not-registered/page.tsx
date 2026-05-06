import Link from 'next/link';

const FLASK_REGISTER_URL = process.env.NEXT_PUBLIC_FLASK_REGISTER_URL || 'http://localhost:5000/register';

export default function NotRegisteredPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold mb-4">
          Cuenta no encontrada
        </h1>
        <p className="text-gray-400 mb-8">
          Tu cuenta de Clerk no está registrada en nuestro sistema.
          Regístrate primero para usar la aplicación.
        </p>
        <div className="flex flex-col gap-4">
          <Link
            href={FLASK_REGISTER_URL}
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Registrarse en la app principal
          </Link>
          <Link
            href="/sign-in"
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
}