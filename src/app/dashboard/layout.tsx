import Link from 'next/link';
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Tag, PlusCircle } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row font-outfit">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/5 bg-[#0a0a0a] fixed h-full">
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-black">V</div>
          <span className="text-xl font-bold tracking-tighter">VELZIA</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link
            href="/dashboard/categories"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
          >
            <Tag className="w-5 h-5" />
            <span className="font-medium">Categorías</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <span className="text-sm font-medium text-gray-400">Mi Cuenta</span>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden h-16 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-black text-sm">V</div>
          <span className="font-bold tracking-tighter">VELZIA</span>
        </div>
        <UserButton afterSignOutUrl="/" />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto p-6 md:p-10">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/5 flex justify-around items-center h-16 px-4 z-40">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] uppercase font-bold tracking-widest">Inicio</span>
        </Link>
        <div className="relative -top-4">
           <Link href="/dashboard?action=scan" className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-black shadow-lg shadow-orange-500/20 active:scale-95 transition-transform">
             <PlusCircle className="w-8 h-8" />
           </Link>
        </div>
        <Link href="/dashboard/categories" className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
          <Tag className="w-6 h-6" />
          <span className="text-[10px] uppercase font-bold tracking-widest">Límites</span>
        </Link>
      </nav>
    </div>
  );
}
