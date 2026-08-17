// ============================================================
// MEGA MART — In-Memory Token Bucket Rate Limiter
// ============================================================

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  resetAt: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

const buckets = new Map<string, TokenBucket>();
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

// Clean expired entries every 60 seconds
function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (bucket.resetAt <= now) {
        buckets.delete(key);
      }
    }
  }, 60_000);
}

// Ensure cleanup starts on first use
startCleanup();

/**
 * Token bucket rate limiter.
 *
 * @param key     - Unique identifier (e.g. IP address, user ID)
 * @param limit   - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns       - { success, remaining, resetAt }
 */
export function rateLimit(
  key: string,
  limit: number = 60,
  windowMs: number = 60_000,
): RateLimitResult {
  const now = Date.now();
  const resetAt = now + windowMs;

  let bucket = buckets.get(key);

  // Create new bucket if none exists or window has expired
  if (!bucket || bucket.resetAt <= now) {
    bucket = {
      tokens: limit,
      lastRefill: now,
      resetAt,
    };
    buckets.set(key, bucket);
  }

  // Refill tokens based on elapsed time (proportional refill)
  const elapsed = now - bucket.lastRefill;
  const refillRate = limit / windowMs; // tokens per ms
  const refill = Math.floor(elapsed * refillRate);

  if (refill > 0) {
    bucket.tokens = Math.min(limit, bucket.tokens + refill);
    bucket.lastRefill = now;
  }

  // Try to consume one token
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return {
      success: true,
      remaining: bucket.tokens,
      resetAt: bucket.resetAt,
    };
  }

  // Rate limit exceeded
  return {
    success: false,
    remaining: 0,
    resetAt: bucket.resetAt,
  };
}

/**
 * Get current bucket stats without consuming a token.
 */
export function getRateLimitStats(key: string): RateLimitResult | null {
  const bucket = buckets.get(key);
  if (!bucket) return null;
  return {
    success: bucket.tokens >= 1,
    remaining: bucket.tokens,
    resetAt: bucket.resetAt,
  };
}

/**
 * Reset a specific rate limit bucket.
 */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/**
 * Stop the cleanup timer (useful for tests / shutdown).
 */
export function stopCleanup(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
