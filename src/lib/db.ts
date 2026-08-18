import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Database configuration for Mega Mart.
 *
 * - LOCAL DEV: Uses SQLite (file:./db/custom.db)
 * - VERCEL: Uses Vercel Postgres (DATABASE_URL from env)
 * - ANY POSTGRES: Uses DATABASE_URL directly
 *
 * The Prisma schema uses "postgresql" provider.
 * For local dev, we override to SQLite at runtime if needed.
 */

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
