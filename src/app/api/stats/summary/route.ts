import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, startOfMonth } from 'date-fns';

function setCorsHeaders(res: NextResponse, req: Request) {
  const origin = req.headers.get('origin') || '*';
  res.headers.set('Access-Control-Allow-Origin', origin);
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  return res;
}

export async function OPTIONS(request: Request) {
  return setCorsHeaders(new NextResponse(null, { status: 204 }), request);
}

export async function GET(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    let userId = null;
    
    console.log('[Stats API] ========== REQUEST START ==========');
    console.log('[Stats API] URL:', request.url);
    console.log('[Stats API] Method:', request.method);
    console.log('[Stats API] Headers:', Object.fromEntries(request.headers.entries()));
    console.log('[Stats API] apiKey present:', !!apiKey);
    console.log('[Stats API] SERVICE_API_KEY in env:', !!process.env.SERVICE_API_KEY);

    // Solo confía en la clave del .env, y asegúrate de que no esté vacía
    if (apiKey && process.env.SERVICE_API_KEY && apiKey === process.env.SERVICE_API_KEY) {
      const { searchParams } = new URL(request.url);
      userId = searchParams.get('userId');
      console.log('[Stats API] S2S mode, userId:', userId);

    } else if (!apiKey) {
      const authResult = await auth();
      userId = authResult.userId;
      console.log('[Stats API] Auth mode, userId:', userId);

    } else {
      console.log('[Stats API] Invalid API key:', apiKey, 'expected:', process.env.SERVICE_API_KEY);
      return setCorsHeaders(NextResponse.json({ error: 'Invalid API Key' }, { status: 401 }), request);
    }

    if (!userId) {
      console.log('[Stats API] No userId found, returning 401');
      return setCorsHeaders(NextResponse.json({ error: 'Unauthorized - no userId' }, { status: 401 }), request);
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'today';

    console.log('[Stats API] Querying expenses for userId:', userId);

    const expenses = await prisma.velzia_expense.aggregate({
      where: {
        userId,
      },
      _sum: {
        amount: true,
      },
    });

    const totalExpenses = expenses._sum.amount || 0;
    console.log('[Stats API] Total expenses:', totalExpenses);
    console.log('[Stats API] Raw aggregate result:', JSON.stringify(expenses));
    console.log('[Stats API] ========== REQUEST END ==========');

    return setCorsHeaders(NextResponse.json({
      success: true,
      totalExpenses,
      range,
      currency: 'COP'
    }), request);

  } catch (error) {
    console.error('[Stats API] Error:', error);
    console.error('[Stats API] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return setCorsHeaders(NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 }), request);
  }
}
