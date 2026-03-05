import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

/**
 * Middleware that protects authenticated routes.
 * Redirects unauthenticated users to /login.
 * Next.js 16 requires an explicit function export.
 */
export async function middleware(request) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // If no token and trying to access a protected route, redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/workspace/:path*",
    "/onboarding",
    "/settings/:path*",
    "/notifications",
    "/search",
  ],
};
