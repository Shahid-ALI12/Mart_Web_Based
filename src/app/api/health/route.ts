// ============================================================
// MEGA MART — Health Check Endpoint
// GET /api/health — Returns system health status
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const timestamp = new Date().toISOString();
  const uptime = process.uptime();
  const memory = process.memoryUsage();

  // Test database connectivity
  let database: 'connected' | 'error' = 'error';
  try {
    await db.$queryRaw`SELECT 1`;
    database = 'connected';
  } catch {
    database = 'error';
  }

  const health = {
    status: database === 'connected' ? ('ok' as const) : ('error' as const),
    timestamp,
    uptime: Math.round(uptime),
    memory: {
      rss: Math.round(memory.rss / 1024 / 1024),
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
      external: Math.round(memory.external / 1024 / 1024),
    },
    database,
  };

  if (database === 'error') {
    return NextResponse.json(health, { status: 503 });
  }

  return NextResponse.json(health, { status: 200 });
}
