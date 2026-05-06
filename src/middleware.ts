import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/not-registered",
  "/api/webhook(.*)",
  "/flask-auth(.*)",
  "/api/auth/flask-token(.*)"
]);

const FLASK_REGISTER_URL = process.env.NEXT_PUBLIC_FLASK_REGISTER_URL || 'http://localhost:5000/register';

export default clerkMiddleware(async (auth, request) => {
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204 });
  }

  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/sign-up')) {
    return NextResponse.redirect(FLASK_REGISTER_URL);
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
