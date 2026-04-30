import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import LandingHeader from '@/components/LandingHeader';

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-orange-500/30">
      <LandingHeader userId={userId} />

      <main>
        {/* Hero / Header Section */}
        <section className="max-w-7xl mx-auto px-6 py-24 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
            Gestión de nivel <span className="accent-text">Superior.</span>
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed font-light">
            Todo el poder de Velzia en una interfaz minimalista diseñada para restauranteros que valoran la eficiencia y el control absoluto.
          </p>
        </section>

        {/* Features Grid */}
        <section id="features" className="max-w-7xl mx-auto px-6 pb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Extracción */}
            <div className="obsidian-card rounded-[2rem] p-10 flex flex-col group">
              <div className="glass-container rounded-2xl w-full aspect-square mb-8 flex items-center justify-center relative overflow-hidden">
                <div className="w-20 h-28 bg-white/5 border border-white/10 rounded flex flex-col p-4 gap-2 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <div className="w-full h-1 bg-white/20 rounded"></div>
                  <div className="w-3/4 h-1 bg-white/20 rounded"></div>
                  <div className="w-full h-1 bg-white/20 rounded"></div>
                  <div className="mt-auto w-1/2 h-4 bg-orange-500/20 rounded border border-orange-500/30"></div>
                </div>
                <div className="scan-line"></div>
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">Extracción Digital</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Sincroniza tus facturas físicamente con un solo clic. Nuestra tecnología procesa montos y datos con precisión milimétrica.
              </p>
            </div>

            {/* Feature 2: Dashboard */}
            <div className="obsidian-card rounded-[2rem] p-10 flex flex-col">
              <div className="glass-container rounded-2xl w-full aspect-square mb-8 flex items-center justify-center relative">
                <svg className="w-3/4 h-3/4" viewBox="0 0 100 60">
                  <path
                    d="M0,50 C20,45 40,20 60,35 T100,10"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2.5"
                    className="glow-icon"
                  />
                  <circle cx="100" cy="10" r="3" fill="#ffffff" />
                  <line
                    x1="0"
                    y1="55"
                    x2="100"
                    y2="55"
                    stroke="white"
                    strokeOpacity="0.1"
                    strokeDasharray="2 2"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">Dashboard Obsidian</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Visualiza el flujo de caja y las métricas críticas de tu negocio en un panel oscuro, elegante y libre de distracciones.
              </p>
            </div>

            {/* Feature 3: Sync */}
            <div className="obsidian-card rounded-[2rem] p-10 flex flex-col">
              <div className="glass-container rounded-2xl w-full aspect-square mb-8 flex items-center justify-center">
                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-24 border-2 border-white/10 rounded-lg bg-white/5"></div>
                  <div className="w-8 h-14 border-2 border-orange-500/30 rounded-md bg-orange-500/5 absolute -bottom-2 -right-4 backdrop-blur-sm"></div>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 tracking-tight">Sincronización Total</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Accede a tu información desde cualquier lugar. Tu inventario, ventas y gastos siempre actualizados en todos tus dispositivos.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-20 text-center">
            {userId ? (
              <Link
                href="/dashboard"
                className="btn-primary px-12 py-5 rounded-full font-bold text-lg inline-block"
              >
                Ir al Dashboard
              </Link>
            ) : (
              <Link
                href="https://www.velzia.co/register?plan=trial"
                className="btn-primary px-12 py-5 rounded-full font-bold text-lg inline-block"
              >
                Probar Velzia Gratis
              </Link>
            )}
            <p className="mt-6 text-gray-600 text-sm">Empieza hoy. Sin complicaciones. Sin rodeos.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center font-bold text-black text-xs">
                V
              </div>
              <span className="font-bold tracking-tighter">VELZIA</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link href="https://www.velzia.co/terms" className="text-gray-500 text-sm hover:text-white transition-colors">
                Términos
              </Link>
              <Link href="https://www.velzia.co/planes" className="text-gray-500 text-sm hover:text-white transition-colors">
                Planes
              </Link>
            </div>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} VELZIA. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
