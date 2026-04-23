import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import ReceiptScanner from "@/components/ReceiptScanner";
import Link from "next/link";
import { AlertCircle, ArrowRight, Download, Settings } from "lucide-react";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Get categories with their budgets for the current month
  const categories = await prisma.category.findMany({
    where: { userId },
    include: {
      budgets: {
        where: { month: currentMonth, year: currentYear },
      },
      expenses: {
        where: {
          date: {
            gte: new Date(currentYear, currentMonth - 1, 1),
            lt: new Date(currentYear, currentMonth, 1),
          },
        },
      },
    },
  });

  const summary = categories.map((cat) => {
    const totalSpent = cat.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const budgetAmount = cat.budget[0]?.amount || 0;
    const percent = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;

    let color = "bg-green-500";
    if (percent >= 90) color = "bg-red-500";
    else if (percent >= 80) color = "bg-yellow-500";

    return {
      id: cat.id,
      name: cat.name,
      totalSpent,
      budgetAmount,
      percent,
      color,
    };
  });

  const totalSpentMonth = summary.reduce((sum, s) => sum + s.totalSpent, 0);
  const totalBudgetMonth = summary.reduce((sum, s) => sum + s.budgetAmount, 0);

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex flex-col">
          <h1 className="text-4xl font-black tracking-[-0.05em] text-white uppercase font-heading">
            Scanner AI <span className="text-primary tracking-normal">2.0</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-2">Intelligence Dashboard</p>
        </div>
        
        <div className="flex gap-3">
          <Link
            href="/api/export"
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-white/5 rounded-2xl hover:bg-zinc-800 text-zinc-400 font-bold text-xs transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            EXPORTAR
          </Link>
          <Link
            href="/dashboard/categories"
            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl hover:bg-zinc-200 font-black text-xs transition-all active:scale-95 shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
          >
            <Settings className="w-4 h-4" />
            CONFIGURAR
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-12">
        <div className="bg-surface/50 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary/10 blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Gasto Total Mes</p>
          <p className="text-3xl font-black text-white tabular-nums tracking-tighter">
            ${totalSpentMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="bg-surface/50 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 relative overflow-hidden">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Presupuesto</p>
          <p className="text-3xl font-black text-white tabular-nums tracking-tighter">
            ${totalBudgetMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-surface/50 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Alertas</p>
          <div className="flex items-end gap-2">
            <p className={`text-3xl font-black tabular-nums tracking-tighter ${summary.filter(s => s.percent >= 80).length > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {summary.filter(s => s.percent >= 80).length}
            </p>
            <span className="text-[10px] font-bold text-zinc-500 mb-1.5 uppercase">Categorías Críticas</span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5 items-start">
        <section className="lg:col-span-3">
          <ReceiptScanner />
        </section>

        <section className="lg:col-span-2 bg-surface/30 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
          <h2 className="text-xl font-black mb-8 text-white uppercase tracking-tight font-heading">Estado de Presupuestos</h2>
          <div className="space-y-8">
            {summary.map((s) => (
              <div key={s.id} className="group">
                <div className="flex justify-between items-end mb-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white uppercase tracking-tighter">{s.name}</span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Consumo Actual</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-black text-white tabular-nums">${s.totalSpent.toFixed(0)}</span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase mt-1">de ${s.budgetAmount.toFixed(0)}</span>
                  </div>
                </div>
                
                <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 relative ${
                      s.percent >= 90 ? 'bg-rose-500' : 
                      s.percent >= 80 ? 'bg-orange-500' : 
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(s.percent, 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  </div>
                </div>
                
                {s.percent >= 80 && (
                  <div className={`mt-3 flex items-center gap-2 p-3 rounded-xl border ${
                    s.percent >= 90 
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' 
                    : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
                  }`}>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">
                      {s.percent >= 90 ? 'Límite Crítico Superado' : 'Cerca del Límite de Gasto'}
                    </span>
                  </div>
                )}
              </div>
            ))}
            
            {summary.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                  <Settings className="w-6 h-6 text-zinc-600" />
                </div>
                <p className="text-zinc-500 text-sm font-medium mb-6">No hay presupuestos activos.</p>
                <Link href="/dashboard/categories" className="inline-flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-widest bg-zinc-800 px-6 py-3 rounded-xl hover:bg-zinc-700 transition-all">
                  Configurar categorías <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className="mt-20 pt-10 border-t border-white/5">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 text-zinc-600 bg-zinc-900/50 px-6 py-3 rounded-2xl border border-white/5">
            <span className="material-symbols-outlined text-[18px]">security</span>
            <p className="text-[10px] font-medium max-w-2xl leading-relaxed italic text-center">
              "Velzia AI utiliza algoritmos avanzados para la detección de gastos. Verifique siempre los resultados antes de tomar decisiones financieras críticas."
            </p>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <span className="h-px w-8 bg-zinc-800"></span>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500">
              Velzia Obsidian Engine v2.0
            </p>
            <span className="h-px w-8 bg-zinc-800"></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
  );
}
