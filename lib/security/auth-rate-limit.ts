/**
 * Sliding-window rate limiter for Edge middleware (in-memory per isolate).
 * Mitigates brute-force login attempts without Redis; for multi-region scale use
 * Upstash + Redis (see cloud-auth runbook).
 */

const STORE_KEY = "__spmAuthRateLimit" as const

function bucketStore(): Map<string, number[]> {
  const g = globalThis as typeof globalThis & {
    [STORE_KEY]?: Map<string, number[]>
  }
  if (!g[STORE_KEY]) g[STORE_KEY] = new Map()
  return g[STORE_KEY]
}

export type AuthRateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number }

/** Count requests in [now - windowMs, now]; allow at most `max` per window. */
export function checkAuthRateLimit(key: string, max: number, windowMs: number): AuthRateLimitResult {
  const store = bucketStore()
  const now = Date.now()
  const windowStart = now - windowMs
  const prev = store.get(key) ?? []
  const recent = prev.filter((t) => t > windowStart)

  if (recent.length >= max) {
    const oldest = recent[0]!
    const retryAfterMs = oldest + windowMs - now
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    }
  }

  recent.push(now)
  store.set(key, recent)
  return { ok: true }
}
