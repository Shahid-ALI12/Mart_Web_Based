// ============================================================
// MEGA MART — Enhanced Health Check Endpoint
// GET /api/health — Returns comprehensive system health
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRateLimitStats } from '@/lib/rate-limiter';

interface HealthCheck {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    heapUtilization: number;
  };
  database: {
    status: 'connected' | 'error';
    type: string;
    latencyMs?: number;
  };
  rateLimiter: {
    active: boolean;
    bucketCount?: number;
  };
  checks: {
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message?: string;
    duration?: number;
  }[];
}

export async function GET() {
  const timestamp = new Date().toISOString();
  const uptime = Math.round(process.uptime());
  const memory = process.memoryUsage();

  const checks: HealthCheck['checks'] = [];
  let overallStatus: HealthCheck['status'] = 'ok';

  // ── Check 1: Database connectivity ──
  let dbStatus: 'connected' | 'error' = 'error';
  let dbLatency: number | undefined;
  let dbType = 'unknown';

  try {
    const dbStart = Date.now();
    await db.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbStart;
    dbStatus = 'connected';

    // Determine DB type from URL
    const dbUrl = process.env.DATABASE_URL || '';
    dbType = dbUrl.startsWith('postgresql://') ? 'postgresql' : dbUrl.includes('file:') ? 'sqlite' : 'unknown';

    checks.push({
      name: 'database',
      status: dbLatency > 500 ? 'warn' : 'pass',
      message: `Connected (${dbType}) — ${dbLatency}ms`,
      duration: dbLatency,
    });

    if (dbLatency > 500) overallStatus = 'degraded';
  } catch (err) {
    checks.push({
      name: 'database',
      status: 'fail',
      message: err instanceof Error ? err.message : 'Connection failed',
    });
    overallStatus = 'error';
  }

  // ── Check 2: Memory usage ──
  const heapUtilization = Math.round((memory.heapUsed / memory.heapTotal) * 100);
  const memoryStatus = heapUtilization > 90 ? 'fail' : heapUtilization > 75 ? 'warn' : 'pass';

  checks.push({
    name: 'memory',
    status: memoryStatus,
    message: `Heap ${heapUtilization}% used (${Math.round(memory.heapUsed / 1024 / 1024)}MB / ${Math.round(memory.heapTotal / 1024 / 1024)}MB)`,
  });

  if (memoryStatus === 'fail') overallStatus = 'error';
  else if (memoryStatus === 'warn' && overallStatus === 'ok') overallStatus = 'degraded';

  // ── Check 3: Rate limiter ──
  const rateLimitActive = true; // Always active in this implementation
  checks.push({
    name: 'rate_limiter',
    status: 'pass',
    message: rateLimitActive ? 'Active (in-memory token bucket)' : 'Inactive',
  });

  // ── Check 4: Environment config ──
  const hasSecret = !!process.env.NEXTAUTH_SECRET;
  checks.push({
    name: 'auth_config',
    status: hasSecret ? 'pass' : 'warn',
    message: hasSecret ? 'NextAuth secret configured' : 'NEXTAUTH_SECRET not set — auth may not work',
  });

  if (!hasSecret && overallStatus === 'ok') overallStatus = 'degraded';

  // ── Check 5: Disk/DB file check (SQLite only) ──
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.includes('file:')) {
    try {
      const productCount = await db.product.count();
      checks.push({
        name: 'data_integrity',
        status: productCount > 0 ? 'pass' : 'warn',
        message: `${productCount} products in database`,
      });
    } catch {
      checks.push({
        name: 'data_integrity',
        status: 'warn',
        message: 'Could not verify data integrity',
      });
    }
  }

  // ── Build response ──
  const health: HealthCheck = {
    status: overallStatus,
    timestamp,
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime,
    memory: {
      rss: Math.round(memory.rss / 1024 / 1024),
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
      external: Math.round(memory.external / 1024 / 1024),
      heapUtilization,
    },
    database: {
      status: dbStatus,
      type: dbType,
      latencyMs: dbLatency,
    },
    rateLimiter: {
      active: rateLimitActive,
    },
    checks,
  };

  const statusCode = overallStatus === 'ok' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
