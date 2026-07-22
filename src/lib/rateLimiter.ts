// In-memory rate limiter (compatible con @upstash/ratelimit API)
// Swap by @upstash/ratelimit + Redis when available.

const store = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 60_000
const MAX_REQUESTS = 30

export async function ratelimit(key: string): Promise<{ success: boolean; remaining: number; reset: number }> {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { success: true, remaining: MAX_REQUESTS - 1, reset: now + WINDOW_MS }
  }

  entry.count++
  return {
    success: entry.count <= MAX_REQUESTS,
    remaining: Math.max(0, MAX_REQUESTS - entry.count),
    reset: entry.resetAt,
  }
}

export function getRateLimitHeaders(remaining: number, reset: number): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(MAX_REQUESTS),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
  }
}
