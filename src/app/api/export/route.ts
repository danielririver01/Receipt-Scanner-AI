import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const expenses = await prisma.expense.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { date: 'desc' }
  });

  const headers = ["Fecha", "Comercio/Descripción", "Monto", "Categoría"];
  const rows = expenses.map((e: any) => [
    e.date.toISOString().split('T')[0],
    `"${(e.description || '').replace(/"/g, '""')}"`,
    e.amount.toString(),
    `"${e.category.name.replace(/"/g, '""')}"`
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gastos_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
