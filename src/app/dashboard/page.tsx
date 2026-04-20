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
      budget: {
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
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard de Gastos</h1>
        <div className="flex gap-4">
          <Link
            href="/api/export"
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 text-slate-700"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </Link>
          <Link
            href="/dashboard/categories"
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700"
          >
            <Settings className="w-4 h-4" />
            Configurar
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 uppercase">Gasto Total Mes</p>
          <p className="text-2xl font-bold text-slate-900">${totalSpentMonth.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 uppercase">Presupuesto Total</p>
          <p className="text-2xl font-bold text-slate-900">${totalBudgetMonth.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 uppercase">Categorías en Alerta</p>
          <p className="text-2xl font-bold text-red-600">
            {summary.filter(s => s.percent >= 80).length}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <ReceiptScanner />
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-slate-900">Estado de Presupuestos</h2>
          <div className="space-y-6">
            {summary.map((s) => (
              <div key={s.id}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-slate-700">{s.name}</span>
                  <span className="text-gray-500">
                    ${s.totalSpent.toFixed(2)} / ${s.budgetAmount.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className={`${s.color} h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(s.percent, 100)}%` }}
                  ></div>
                </div>
                {s.percent >= 90 && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    ¡Crítico! Has superado el 90% del presupuesto.
                  </p>
                )}
                {s.percent >= 80 && s.percent < 90 && (
                  <p className="text-yellow-600 text-xs mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    Atención: Estás cerca del límite (80%+).
                  </p>
                )}
              </div>
            ))}
            {summary.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4 text-slate-500">No tienes presupuestos configurados.</p>
                <Link href="/dashboard/categories" className="text-blue-600 hover:underline flex items-center justify-center gap-1">
                  Configurar categorías <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
