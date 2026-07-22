import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/preview(.*)",
  "/sign-in(.*)",
  "/not-registered",
  "/api/webhook(.*)",
  "/api/test(.*)",
  "/api/health(.*)",
  "/api/stats(.*)",
  "/api/tokens/status(.*)",
  "/api/checkout(.*)",
  "/flask-auth(.*)",
  "/api/auth/flask-token(.*)"
]);

const FLASK_REGISTER_URL = process.env.NEXT_PUBLIC_FLASK_REGISTER_URL || 'http://localhost:5000/register';

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  // /flask-auth maneja su propia autenticación via JWT de Flask
  if (pathname.startsWith('/flask-auth')) {
    return NextResponse.next();
  }

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204 });
  }

  if (pathname.startsWith('/sign-up')) {
    return NextResponse.redirect(`${FLASK_REGISTER_URL}?plan=trial`);
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
