import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { checkAuthRateLimit } from "@/lib/security/auth-rate-limit"
import { applySecurityHeaders } from "@/lib/security/security-headers"

function clientIp(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for")
  if (xf) {
    const first = xf.split(",")[0]?.trim()
    if (first) return first
  }
  const real = req.headers.get("x-real-ip")
  if (real?.trim()) return real.trim()
  return "unknown"
}

function authRateLimitConfig(): { max: number; windowMs: number } {
  const max = Math.max(
    3,
    Math.min(500, Number.parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? "20", 10) || 20)
  )
  const windowSec = Math.max(
    60,
    Math.min(86_400, Number.parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_SEC ?? "900", 10) || 900)
  )
  return { max, windowMs: windowSec * 1000 }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/auth") && request.method === "POST") {
    const ip = clientIp(request)
    const key = `auth:${ip}`
    const { max, windowMs } = authRateLimitConfig()
    const result = checkAuthRateLimit(key, max, windowMs)
    if (!result.ok) {
      const res = NextResponse.json(
        { error: "Too many authentication attempts. Try again later." },
        { status: 429 }
      )
      res.headers.set("Retry-After", String(result.retryAfterSec))
      applySecurityHeaders(res.headers)
      return res
    }
  }

  const res = NextResponse.next()
  applySecurityHeaders(res.headers)
  return res
}

export const config = {
  matcher: [
    /*
     * All routes except Next internals and common static assets (still applies to pages + API).
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
