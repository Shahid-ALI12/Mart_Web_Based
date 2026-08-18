// ============================================================
// MEGA MART — Next.js Middleware
// Rate limiting, security headers, CORS, request logging
// ============================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from '@/lib/rate-limiter';
import { getSecurityHeaders } from '@/lib/security-headers';
import { getCorsHeaders, isPreflightRequest, createPreflightResponse } from '@/lib/cors';

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

/** Routes that bypass middleware entirely */
const PUBLIC_PATHS = [
  '/api/auth',
  '/api/health',
  '/_next',
  '/static',
];

/** Routes that have stricter rate limits */
const STRICT_RATE_LIMIT_PATHS: Record<string, { limit: number; windowMs: number }> = {
  '/api/auth': { limit: 10, windowMs: 60_000 },       // 10 login attempts/min
  '/api/orders': { limit: 30, windowMs: 60_000 },      // 30 orders/min
  '/api/cart': { limit: 30, windowMs: 60_000 },        // 30 cart ops/min
  '/api/coupons': { limit: 10, windowMs: 60_000 },     // 10 coupon checks/min
  '/api/loyalty': { limit: 15, windowMs: 60_000 },     // 15 loyalty ops/min
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((publicPath) => pathname.startsWith(publicPath));
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

function getClientIp(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp.trim();
  }
  return 'unknown';
}

/**
 * Generate a unique request ID for tracing.
 */
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Get rate limit config for a specific path.
 */
function getRateLimitConfig(pathname: string): { limit: number; windowMs: number } {
  for (const [path, config] of Object.entries(STRICT_RATE_LIMIT_PATHS)) {
    if (pathname.startsWith(path)) {
      return config;
    }
  }
  // Default: 60 requests per minute
  return { limit: 60, windowMs: 60_000 };
}

// ──────────────────────────────────────────────
// Request Logger
// ──────────────────────────────────────────────
const isDev = process.env.NODE_ENV === 'development';

function logRequest(
  method: string,
  pathname: string,
  requestId: string,
  clientIp: string,
  duration: number,
  status?: number,
) {
  // Skip logging for health checks and static assets in production
  if (!isDev && pathname === '/api/health') return;

  const statusStr = status ? ` [${status}]` : '';
  const durationStr = duration > 1000 ? ` ⚠️${duration}ms` : ` ${duration}ms`;

  if (isDev) {
    console.log(
      `[MW] ${method} ${pathname}${statusStr}${durationStr} ip=${clientIp} rid=${requestId}`,
    );
  } else {
    // Production: only log slow requests or errors
    if (duration > 2000 || (status && status >= 400)) {
      console.warn(
        `[MW] ${method} ${pathname} [${status}] ${duration}ms ip=${clientIp} rid=${requestId}`,
      );
    }
  }
}

// ──────────────────────────────────────────────
// Middleware
// ──────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const startTime = Date.now();
  const requestId = generateRequestId();

  // Skip middleware for public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // ── Handle CORS preflight requests ──
  if (isApiRoute(pathname) && isPreflightRequest(method)) {
    const response = createPreflightResponse(request.headers.get('origin'));
    logRequest(method, pathname, requestId, getClientIp(request), Date.now() - startTime, 204);
    return response;
  }

  // ── Rate limiting for API routes ──
  if (isApiRoute(pathname)) {
    const clientIp = getClientIp(request);
    const { limit, windowMs } = getRateLimitConfig(pathname);
    const result = rateLimit(`api:${clientIp}:${pathname.split('/').slice(0, 3).join('/')}`, limit, windowMs);

    if (!result.success) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      logRequest(method, pathname, requestId, clientIp, Date.now() - startTime, 429);

      const response = NextResponse.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please try again later.',
            retryAfter,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 429 },
      );

      response.headers.set('Retry-After', String(retryAfter));
      response.headers.set('X-Request-ID', requestId);
      return response;
    }

    // Continue with rate limit + security + CORS headers
    const response = NextResponse.next();

    // Rate limit info headers
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
    response.headers.set('X-Request-ID', requestId);

    // Security headers
    const securityHeaders = getSecurityHeaders();
    securityHeaders.forEach((value, key) => {
      response.headers.set(key, value);
    });

    // CORS headers
    const corsHeaders = getCorsHeaders(request.headers.get('origin'));
    corsHeaders.forEach((value, key) => {
      response.headers.set(key, value);
    });

    logRequest(method, pathname, requestId, clientIp, Date.now() - startTime);
    return response;
  }

  // ── Non-API routes: security headers + CORS ──
  const response = NextResponse.next();

  // Security headers
  const securityHeaders = getSecurityHeaders();
  securityHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });

  // CORS headers
  const corsHeaders = getCorsHeaders(request.headers.get('origin'));
  corsHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });

  response.headers.set('X-Request-ID', requestId);

  logRequest(method, pathname, requestId, getClientIp(request), Date.now() - startTime);
  return response;
}

// ──────────────────────────────────────────────
// Matcher: Skip static assets
// ──────────────────────────────────────────────
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
