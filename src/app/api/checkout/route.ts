import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = user.emailAddresses[0]?.emailAddress;
    const body = await request.json();
    const pack = body.pack || '5k'; // 5k o 10k

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
