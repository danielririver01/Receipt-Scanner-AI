import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { clerkClient } from '@clerk/nextjs/server';

const FLASK_SECRET = process.env.FLASK_SECRET_KEY || 'TU_CLAVE_SECRETA_AQUI';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flask_token } = body;

    if (!flask_token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    }

    // 1. Verificar el JWT firmado por Flask
    let decoded: { clerk_id: string; user_id: number; email: string };
    try {
      decoded = jwt.verify(flask_token, FLASK_SECRET, { algorithms: ['HS256'] }) as any;
    } catch {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
    }

    // 2. Verificar que el usuario existe en Clerk
    const clerk = clerkClient();
    try {
      await clerk.users.getUser(decoded.clerk_id);
    } catch {
      return NextResponse.json({ error: 'Usuario no encontrado en Clerk' }, { status: 404 });
    }

    // 3. Retornar datos para que el frontend redirija al Sign-In pre-llenado
    return NextResponse.json({
      success: true,
      clerk_id: decoded.clerk_id,
      email: decoded.email,
    });
  } catch (error: any) {
    console.error('Flask token auth error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}
