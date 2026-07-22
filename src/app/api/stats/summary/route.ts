import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, startOfMonth } from 'date-fns';
import { ratelimit, getRateLimitHeaders } from '@/lib/rateLimiter';

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
    
    // Solo confía en la clave del .env, y asegúrate de que no esté vacía
    if (apiKey && process.env.SERVICE_API_KEY && apiKey === process.env.SERVICE_API_KEY) {
      const { searchParams } = new URL(request.url);
      userId = searchParams.get('userId');

    } else if (!apiKey) {
      const authResult = await auth();
      userId = authResult.userId;

    } else {
      return setCorsHeaders(NextResponse.json({ error: 'Invalid API Key' }, { status: 401 }), request);
    }

    if (!userId) {
      return setCorsHeaders(NextResponse.json({ error: 'Unauthorized - no userId' }, { status: 401 }), request);
    }

    const limitKey = `user:${userId}`
    const { success, remaining, reset } = await ratelimit(limitKey)
    if (!success) {
      return setCorsHeaders(
        NextResponse.json(
          { error: 'Too many requests' },
          { status: 429, headers: { 'Retry-After': '60', ...getRateLimitHeaders(remaining, reset) } }
        ),
        request
      )
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'today';

    const expenses = await prisma.expense.aggregate({
      where: {
        userId,
      },
      _sum: {
        amount: true,
      },
    });

    const totalExpenses = expenses._sum.amount || 0;

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
