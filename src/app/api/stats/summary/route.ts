import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, startOfMonth } from 'date-fns';

function setCorsHeaders(res: NextResponse, req: Request) {
  const origin = req.headers.get('origin') || '*';
  res.headers.set('Access-Control-Allow-Origin', origin);
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}

export async function OPTIONS(request: Request) {
  return setCorsHeaders(new NextResponse(null, { status: 204 }), request);
}

export async function GET(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    let userId = null;

    // Solo confía en la clave del .env, y asegúrate de que no esté vacía
    if (apiKey && process.env.SERVICE_API_KEY && apiKey === process.env.SERVICE_API_KEY) {
      const { searchParams } = new URL(request.url);
      userId = searchParams.get('userId');

    } else {
      const authResult = await auth();
      userId = authResult.userId;
    }

    if (!userId) {
      return setCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), request);
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'today'; // 'today' or 'month'

    let startDate = startOfDay(new Date());
    if (range === 'month') {
      startDate = startOfMonth(new Date());
    }

    const expenses = await prisma.expense.aggregate({
      where: {
        userId,
        date: {
          gte: startDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return setCorsHeaders(NextResponse.json({
      success: true,
      totalExpenses: expenses._sum.amount || 0,
      range,
      currency: 'COP'
    }), request);

  } catch (error) {
    console.error('Error fetching stats:', error);
    return setCorsHeaders(NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }), request);
  }
}
