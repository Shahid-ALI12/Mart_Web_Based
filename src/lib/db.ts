import { PrismaClient } from '@prisma/client'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Resolve SQLite database path relative to project root
// This ensures the DB file is found both locally and on Vercel
function getDatabaseUrl(): string | undefined {
  const envUrl = process.env.DATABASE_URL

  // If it's a PostgreSQL URL or already absolute, use as-is
  if (!envUrl || envUrl.startsWith('postgresql://') || envUrl.startsWith('postgres://')) {
    return envUrl
  }

  // For SQLite relative paths, resolve against process.cwd()
  if (envUrl.startsWith('file:')) {
    const relativePath = envUrl.replace('file:', '')
    if (relativePath.startsWith('/') || relativePath.startsWith('\\')) {
      // Already absolute path
      return envUrl
    }
    // Resolve relative path
    const absolutePath = path.join(process.cwd(), relativePath)
    return `file:${absolutePath}`
  }

  return envUrl
}

// Set resolved DATABASE_URL before Prisma initializes
const resolvedUrl = getDatabaseUrl()
if (resolvedUrl && resolvedUrl !== process.env.DATABASE_URL) {
  process.env.DATABASE_URL = resolvedUrl
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
