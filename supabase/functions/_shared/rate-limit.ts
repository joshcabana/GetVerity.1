/**
 * Simple in-memory rate limiter for edge functions.
 * Uses a sliding window counter per key (typically user ID or IP).
 *
 * NOTE: Deno Deploy edge functions may run across multiple isolates,
 * so this is per-isolate — not globally distributed. It still prevents
 * a single connection from hammering the same isolate.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically (every 60s)
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

/**
 * Check if the request should be rate-limited.
 *
 * @param key     Unique identifier (e.g. user ID or IP)
 * @param limit   Max requests allowed within the window
 * @param windowMs  Window duration in milliseconds (default 60 000 = 1 minute)
 * @returns `true` if the request is allowed, `false` if rate-limited.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): boolean {
  cleanup();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  entry.count++;
  if (entry.count > limit) {
    return false;
  }
  return true;
}
