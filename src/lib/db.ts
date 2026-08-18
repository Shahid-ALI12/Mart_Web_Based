import { PrismaClient } from '@prisma/client'
import path from 'path'
import fs from 'fs'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Resolve the correct database URL for the current environment.
 *
 * LOCAL: Uses the DATABASE_URL as-is (SQLite or PostgreSQL)
 * VERCEL: Copies the SQLite DB to /tmp (writable) and uses that path
 *         This allows reads to work. Writes work within a single
 *         function invocation but won't persist across cold starts.
 */
function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL || 'file:./db/custom.db'

  // PostgreSQL — use as-is (works on Vercel)
  if (envUrl.startsWith('postgresql://') || envUrl.startsWith('postgres://')) {
    return envUrl
  }

  // SQLite handling
  if (envUrl.startsWith('file:')) {
    const relativePath = envUrl.replace('file:', '').trim()

    // Already absolute path — use directly
    if (relativePath.startsWith('/') || relativePath.startsWith('\\')) {
      return envUrl
    }

    // Resolve relative to project root
    const projectRoot = process.cwd()
    const absolutePath = path.join(projectRoot, relativePath)

    // On Vercel (or any read-only FS), copy DB to /tmp for write access
    const isVercel = !!process.env.VERCEL
    if (isVercel) {
      const tmpDbPath = '/tmp/megamart.db'

      // Copy DB to /tmp if not already there or if source is newer
      if (!fs.existsSync(tmpDbPath)) {
        try {
          if (fs.existsSync(absolutePath)) {
            fs.copyFileSync(absolutePath, tmpDbPath)
            console.log(`[DB] Copied SQLite to /tmp: ${absolutePath} → ${tmpDbPath}`)
          } else {
            console.warn(`[DB] SQLite file not found at ${absolutePath}, trying /tmp fallback`)
          }
        } catch (err) {
          console.error('[DB] Failed to copy SQLite to /tmp:', err)
        }
      }

      return `file:${tmpDbPath}`
    }

    return `file:${absolutePath}`
  }

  return envUrl
}

// Set resolved DATABASE_URL before Prisma initializes
const resolvedUrl = getDatabaseUrl()
if (resolvedUrl !== process.env.DATABASE_URL) {
  process.env.DATABASE_URL = resolvedUrl
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
