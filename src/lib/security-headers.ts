// ============================================================
// MEGA MART — Security Headers Configuration
// ============================================================

/**
 * Returns a Headers object populated with production-grade security headers.
 * These protect against common web vulnerabilities:
 * - MIME type sniffing
 * - Clickjacking (iframe embedding)
 * - XSS attacks
 * - Information leakage via referrer
 * - Feature/API access restrictions
 * - Content injection via CSP
 * - Transport security (HSTS)
 */
export function getSecurityHeaders(): Headers {
  const headers = new Headers();

  // Prevent MIME type sniffing — browser must respect declared Content-Type
  headers.set('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking — disallow framing from other origins
  headers.set('X-Frame-Options', 'DENY');

  // Enable browser XSS filter (legacy but still useful for older browsers)
  headers.set('X-XSS-Protection', '1; mode=block');

  // Control referrer information sent with requests
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restrict browser features and APIs
  headers.set(
    'Permissions-Policy',
    [
      'camera=()',
      'microphone=()',
      'geolocation=(self)',
      'payment=(self)',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=(self)',
      'encrypted-media=(self)',
      'fullscreen=(self)',
      'picture-in-picture=(self)',
      'sync-xhr=(self)',
    ].join(', '),
  );

  // Content Security Policy — restrict resource origins
  // Development-friendly: allows localhost for hot reload; tighten for production
  const isDev = process.env.NODE_ENV === 'development';

  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline and unsafe-eval for dev
    isDev
      ? "connect-src 'self' http://localhost:* ws://localhost:*"
      : "connect-src 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'", // Tailwind / CSS-in-JS requires unsafe-inline
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'", // stronger than X-Frame-Options
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    isDev ? '' : "upgrade-insecure-requests",
  ]
    .filter(Boolean)
    .join('; ');

  headers.set('Content-Security-Policy', cspDirectives);

  // HTTP Strict Transport Security — force HTTPS for 1 year + include subdomains
  // Only set in production (HSTS in development breaks HTTP localhost)
  if (!isDev) {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  return headers;
}

/**
 * Merge security headers into an existing Headers object.
 */
export function applySecurityHeaders(headers: Headers): Headers {
  const securityHeaders = getSecurityHeaders();
  securityHeaders.forEach((value, key) => {
    headers.set(key, value);
  });
  return headers;
}
