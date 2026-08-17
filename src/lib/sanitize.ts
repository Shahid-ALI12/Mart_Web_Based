// ============================================================
// MEGA MART — Input Sanitization Utilities
// Protects against XSS, injection, and malformed input
// ============================================================

/**
 * Strip all HTML tags from a string.
 * Removes anything between < and > characters.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Remove dangerous HTML/script content while preserving safe text.
 * Handles:
 *  - <script> tags and their contents
 *  - Event handler attributes (onclick, onload, etc.)
 *  - javascript: URLs
 *  - data: URLs in src/href
 */
export function sanitizeHtml(input: string): string {
  let clean = input;

  // Remove <script> tags and their content
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handler attributes
  clean = clean.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove javascript: URLs
  clean = clean.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href=""');
  clean = clean.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, 'src=""');

  // Remove data: URLs in src attributes (can contain injected scripts)
  clean = clean.replace(/src\s*=\s*["']data:[^"']*["']/gi, 'src=""');

  return clean;
}

/**
 * Sanitize a string for safe storage and display.
 * - Trims whitespace
 * - Strips HTML tags
 * - Normalizes unicode characters
 * - Limits length
 */
export function sanitizeString(
  input: string,
  options: {
    maxLength?: number;
    allowHtml?: boolean;
    trim?: boolean;
  } = {},
): string {
  const { maxLength = 10000, allowHtml = false, trim = true } = options;

  if (typeof input !== 'string') return '';

  let clean = input;

  // Trim whitespace
  if (trim) {
    clean = clean.trim();
  }

  // Strip HTML unless explicitly allowed
  if (!allowHtml) {
    clean = stripHtml(clean);
  } else {
    clean = sanitizeHtml(clean);
  }

  // Normalize zero-width characters and other unicode tricks
  clean = clean.replace(/[\u200B-\u200D\uFEFF]/g, ''); // Zero-width spaces
  clean = clean.replace(/\u00A0/g, ' '); // Non-breaking space → regular space

  // Remove null bytes
  clean = clean.replace(/\0/g, '');

  // Limit length
  if (clean.length > maxLength) {
    clean = clean.slice(0, maxLength);
  }

  return clean;
}

/**
 * Recursively sanitize all string values in an object.
 * Handles nested objects and arrays.
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: {
    maxLength?: number;
    allowHtmlFields?: string[]; // Fields that allow safe HTML
    skipFields?: string[]; // Fields to skip entirely (e.g. passwords, tokens)
  } = {},
): T {
  const { maxLength = 10000, allowHtmlFields = [], skipFields = [] } = options;

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip sensitive fields (don't sanitize passwords, tokens, etc.)
    if (skipFields.includes(key)) {
      result[key] = value;
      continue;
    }

    if (typeof value === 'string') {
      result[key] = sanitizeString(value, {
        maxLength,
        allowHtml: allowHtmlFields.includes(key),
      });
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => {
        if (typeof item === 'string') {
          return sanitizeString(item, {
            maxLength,
            allowHtml: allowHtmlFields.includes(key),
          });
        }
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          return sanitizeObject(item as Record<string, unknown>, options);
        }
        return item;
      });
    } else if (value && typeof value === 'object') {
      result[key] = sanitizeObject(value as Record<string, unknown>, options);
    } else {
      // Numbers, booleans, null, undefined — pass through
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Sanitize a filename to prevent directory traversal attacks.
 * Removes: ../, ..\, /, \, null bytes
 */
export function sanitizeFilename(input: string): string {
  let clean = input.trim();

  // Remove directory traversal sequences
  clean = clean.replace(/\.\./g, '');
  clean = clean.replace(/\/+/g, '');
  clean = clean.replace(/\\+/g, '');

  // Remove null bytes
  clean = clean.replace(/\0/g, '');

  // Only allow safe characters: alphanumeric, hyphens, underscores, dots
  clean = clean.replace(/[^a-zA-Z0-9._-]/g, '');

  // Limit length
  if (clean.length > 255) {
    clean = clean.slice(0, 255);
  }

  return clean;
}

/**
 * Validate and sanitize a URL to prevent SSRF and javascript: URLs.
 * Only allows http: and https: protocols.
 */
export function sanitizeUrl(input: string): string {
  const trimmed = input.trim().toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return '';
    }
  }

  // Must start with http: or https:
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return '';
  }

  return input.trim();
}

/**
 * Sanitize an email address.
 * - Trims whitespace
 * - Lowercases
 * - Removes angle brackets
 * - Basic format check
 */
export function sanitizeEmail(input: string): string {
  let clean = input.trim().toLowerCase();

  // Remove angle brackets
  clean = clean.replace(/[<>]/g, '');

  // Remove spaces
  clean = clean.replace(/\s/g, '');

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean)) {
    return '';
  }

  return clean;
}

/**
 * Sanitize a phone number (Pakistani format).
 * - Removes non-digit characters (except +)
 * - Validates PK format: +92XXXXXXXXXX or 0XXXXXXXXXX
 */
export function sanitizePhone(input: string): string {
  let clean = input.trim();

  // Keep only digits and leading +
  clean = clean.replace(/[^0-9+]/g, '');

  // Remove duplicate + signs
  clean = clean.replace(/\++/g, '+');
  if (clean.indexOf('+') > 0) {
    clean = clean.replace(/\+/g, '');
  }

  // Pakistani number validation
  // +92XXXXXXXXXX (13 chars with +92) or 0XXXXXXXXXX (11 chars)
  if (clean.startsWith('+92') && clean.length === 13) {
    return clean;
  }
  if (clean.startsWith('0') && clean.length === 11) {
    return clean;
  }

  // Return cleaned value even if format isn't perfect PK format
  // (might be international number)
  return clean;
}

/**
 * Escape special regex characters in a string.
 * Useful for building safe regex patterns from user input.
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if a string contains suspicious patterns that might indicate
 * an injection attempt (SQL, NoSQL, XSS, path traversal).
 */
export function detectInjection(input: string): {
  safe: boolean;
  detected: string[];
} {
  const detected: string[] = [];

  // SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC)\b)/i,
    /(--|;|\/\*|\*\/)/,
    /('(\s)*(OR|AND)(\s)*')/i,
  ];

  // NoSQL injection patterns
  const noSqlPatterns = [
    /\$where/i,
    /\$gt/i,
    /\$lt/i,
    /\$ne/i,
    /\$or/i,
    /\$and/i,
    /\{.*:.*\$/,
  ];

  // XSS patterns
  const xssPatterns = [
    /<script\b/i,
    /on\w+\s*=/i,
    /javascript:/i,
    /vbscript:/i,
    /<iframe\b/i,
    /<object\b/i,
    /<embed\b/i,
  ];

  // Path traversal patterns
  const pathPatterns = [
    /\.\.\//,
    /\.\.\//,
    /\/etc\/passwd/i,
    /\/proc\/self/i,
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) detected.push('sql');
  }
  for (const pattern of noSqlPatterns) {
    if (pattern.test(input)) detected.push('nosql');
  }
  for (const pattern of xssPatterns) {
    if (pattern.test(input)) detected.push('xss');
  }
  for (const pattern of pathPatterns) {
    if (pattern.test(input)) detected.push('path_traversal');
  }

  return {
    safe: detected.length === 0,
    detected: [...new Set(detected)], // Deduplicate
  };
}
