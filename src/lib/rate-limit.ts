/**
 * Simple In-Memory Rate Limiter
 *
 * Provides basic rate limiting for auth endpoints.
 * Uses a sliding window algorithm.
 *
 * ⚠️ IMPORTANT: This is for development/single-server use only.
 * For production with multiple instances, replace with Redis-based solution.
 *
 * @example
 * ```typescript
 * import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
 *
 * export async function POST(request: Request) {
 *   const ip = request.headers.get('x-forwarded-for') || 'unknown';
 *   const key = getRateLimitKey('login', ip);
 *
 *   if (!rateLimit(key, 5, 60000)) { // 5 attempts per minute
 *     return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
 *   }
 *   // ... proceed with login
 * }
 * ```
 */

// Store request timestamps per key
const requests = new Map<string, number[]>();

// Cleanup interval (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// Clean up old entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    requests.forEach((timestamps, key) => {
      // Keep only timestamps from the last hour
      const recent = timestamps.filter((t) => now - t < 60 * 60 * 1000);
      if (recent.length === 0) {
        keysToDelete.push(key);
      } else {
        requests.set(key, recent);
      }
    });
    
    keysToDelete.forEach((key) => requests.delete(key));
  }, CLEANUP_INTERVAL);
}

/**
 * Check if a request should be rate limited
 *
 * @param key - Unique identifier for the rate limit (e.g., "login:192.168.1.1")
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns true if request is allowed, false if rate limited
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get existing timestamps for this key
  const timestamps = requests.get(key) || [];

  // Filter to only timestamps within the window
  const recentTimestamps = timestamps.filter((t) => t > windowStart);

  // Check if limit exceeded
  if (recentTimestamps.length >= limit) {
    return false; // Rate limited
  }

  // Add current timestamp and update
  recentTimestamps.push(now);
  requests.set(key, recentTimestamps);

  return true; // Request allowed
}

/**
 * Get remaining requests in the current window
 *
 * @param key - Unique identifier for the rate limit
 * @param limit - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Number of remaining requests
 */
export function getRateLimitRemaining(key: string, limit: number, windowMs: number): number {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = requests.get(key) || [];
  const recentCount = timestamps.filter((t) => t > windowStart).length;
  return Math.max(0, limit - recentCount);
}

/**
 * Get time until rate limit resets
 *
 * @param key - Unique identifier for the rate limit
 * @param windowMs - Time window in milliseconds
 * @returns Milliseconds until oldest request expires from window, or 0 if not limited
 */
export function getRateLimitReset(key: string, windowMs: number): number {
  const now = Date.now();
  const timestamps = requests.get(key);
  if (!timestamps || timestamps.length === 0) {
    return 0;
  }
  const oldest = Math.min(...timestamps);
  const resetTime = oldest + windowMs - now;
  return Math.max(0, resetTime);
}

/**
 * Helper to generate rate limit keys
 *
 * @param action - The action being rate limited (e.g., "login", "register")
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @returns A combined key for rate limiting
 */
export function getRateLimitKey(action: string, identifier: string): string {
  return `${action}:${identifier}`;
}

/**
 * Rate limit configuration presets
 */
export const RATE_LIMITS = {
  // Auth endpoints - strict limits
  LOGIN: { limit: 5, windowMs: 60 * 1000 }, // 5 per minute
  REGISTER: { limit: 3, windowMs: 60 * 1000 }, // 3 per minute
  PASSWORD_RESET: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour

  // API endpoints - more lenient
  API_READ: { limit: 100, windowMs: 60 * 1000 }, // 100 per minute
  API_WRITE: { limit: 20, windowMs: 60 * 1000 }, // 20 per minute

  // Uploads - moderate limits
  UPLOAD: { limit: 10, windowMs: 60 * 1000 }, // 10 per minute
} as const;
