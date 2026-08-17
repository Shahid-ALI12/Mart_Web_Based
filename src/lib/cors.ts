// ============================================================
// MEGA MART — CORS Configuration
// Controlled cross-origin access for API routes
// ============================================================

/**
 * Allowed origins for CORS.
 * In production, only specific domains should be allowed.
 * In development, localhost variants are permitted.
 */
function getAllowedOrigins(): string[] {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    return [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ];
  }

  // Production: only the app's own domain + any configured additional origins
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const additionalOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);

  return [appUrl, ...additionalOrigins].filter(Boolean);
}

/**
 * Methods allowed for cross-origin requests.
 */
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

/**
 * Headers that clients are allowed to send in CORS requests.
 */
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'X-Request-ID',
  'Accept',
  'Origin',
  'Cache-Control',
];

/**
 * Headers exposed to the client in CORS responses.
 */
const EXPOSED_HEADERS = [
  'X-RateLimit-Remaining',
  'X-RateLimit-Reset',
  'X-Request-ID',
];

/**
 * Check if an origin is allowed and return CORS headers.
 */
export function getCorsHeaders(requestOrigin: string | null): Headers {
  const headers = new Headers();
  const allowedOrigins = getAllowedOrigins();

  // Determine if the request origin is allowed
  const origin = requestOrigin || '';
  const isAllowed = allowedOrigins.some((allowed) => {
    if (allowed === '*') return true;
    return origin === allowed;
  });

  if (isAllowed && origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '));
    headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(', '));
    headers.set('Access-Control-Expose-Headers', EXPOSED_HEADERS.join(', '));
    headers.set('Access-Control-Max-Age', '86400'); // 24 hours preflight cache
    headers.set('Vary', 'Origin');
  }

  return headers;
}

/**
 * Check if a request is a CORS preflight (OPTIONS) request.
 */
export function isPreflightRequest(method: string): boolean {
  return method === 'OPTIONS';
}

/**
 * Create a preflight response with appropriate CORS headers.
 */
export function createPreflightResponse(requestOrigin: string | null): Response {
  const corsHeaders = getCorsHeaders(requestOrigin);
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
