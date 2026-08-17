// ============================================================
// MEGA MART — Next.js Middleware
// Rate limiting, security headers, route protection
// ============================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from '@/lib/rate-limiter';
import { getSecurityHeaders } from '@/lib/security-headers';

// Routes that bypass middleware entirely
const PUBLIC_PATHS = [
  '/api/auth',
  '/api/health',
  '/_next',
  '/static',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((publicPath) => pathname.startsWith(publicPath));
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

function getClientIp(request: NextRequest): string {
  // Check forwarded headers first (proxy/load-balancer)
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp.trim();
  }

  // Fallback — use a generic identifier
  return 'unknown';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Rate limit API routes: 60 requests per minute per IP
  if (isApiRoute(pathname)) {
    const clientIp = getClientIp(request);
    const result = rateLimit(`api:${clientIp}`, 60, 60_000);

    if (!result.success) {
      const response = NextResponse.json(
        {
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        },
        { status: 429 },
      );

      response.headers.set('Retry-After', String(Math.ceil((result.resetAt - Date.now()) / 1000)));
      return response;
    }

    // Continue with rate limit headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

    // Apply security headers to API responses
    const securityHeaders = getSecurityHeaders();
    securityHeaders.forEach((value, key) => {
      response.headers.set(key, value);
    });

    return response;
  }

  // Apply security headers to all non-API routes
  const response = NextResponse.next();
  const securityHeaders = getSecurityHeaders();
  securityHeaders.forEach((value, key) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
