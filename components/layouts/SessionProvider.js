"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

/**
 * Wraps the app in NextAuth session context.
 * Must be a client component because it uses React context.
 * Placed in the root layout so session is available everywhere.
 */
export default function SessionProvider({ children, session }) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}
