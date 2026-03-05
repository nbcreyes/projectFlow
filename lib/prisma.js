import { PrismaClient } from "@prisma/client";

/**
 * PrismaClient singleton for Next.js.
 * Prevents exhausting database connections during hot reloads in development.
 */
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
