import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * NextAuth route handler.
 * Handles all auth endpoints:
 *   GET/POST /api/auth/signin
 *   GET/POST /api/auth/signout
 *   GET/POST /api/auth/session
 *   GET/POST /api/auth/callback/credentials
 *   GET      /api/auth/csrf
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };