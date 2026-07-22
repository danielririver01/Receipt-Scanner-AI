import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ratelimit, getRateLimitHeaders } from '@/lib/rateLimiter';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limitKey = `user:${userId}`
    const { success, remaining, reset } = await ratelimit(limitKey)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60', ...getRateLimitHeaders(remaining, reset) } }
      )
    }

    // El email se obtiene de la base de datos (igual que /api/tokens/status),
    // evitando depender de currentUser() de Clerk, que puede fallar en el cliente.
    const dbUser = await prisma.users.findFirst({
      where: { clerk_id: userId }
    });
    const email = dbUser?.email ?? null;

    const body = await request.json();
    const pack = body.pack || '25'; // 25, 50 o 100

    // Orderfox Backend URL (Flask)
    const ORDERFOX_URL = process.env.ORDERFOX_URL || 'http://127.0.0.1:5000';
    const API_KEY = process.env.SERVICE_API_KEY;

    if (!API_KEY) {
      console.error('Falta SERVICE_API_KEY en el .env');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Petición S2S (Servidor a Servidor) hacia Flask
    const flaskResponse = await fetch(`${ORDERFOX_URL}/api/tokens/topup/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        pack: pack,
        clerk_id: userId,
        email: email
      })
    });

    let data;
    const responseText = await flaskResponse.text();
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parseando JSON de Flask. Respuesta pura:', responseText);
      return NextResponse.json({ error: 'Respuesta inválida del servidor principal' }, { status: 502 });
    }

    if (!flaskResponse.ok || data.error) {
      console.error('Error desde Flask:', data.error || data);
      return NextResponse.json({ error: data.error || 'Error al conectar con el servidor principal' }, { status: flaskResponse.status });
    }

    // Devolver la URL de Mercado Pago al cliente de Next.js
    return NextResponse.json({
      success: true,
      checkout_url: data.checkout_url
    });

  } catch (error) {
    console.error('Error in checkout API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
