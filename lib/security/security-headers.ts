import type { NextResponse } from "next/server"

/** Baseline security headers for App Router responses (middleware + can reuse elsewhere). */
export function applySecurityHeaders(headers: Headers): void {
  headers.set("X-DNS-Prefetch-Control", "on")
  headers.set("X-Frame-Options", "SAMEORIGIN")
  headers.set("X-Content-Type-Options", "nosniff")
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  if (process.env.NODE_ENV === "production") {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  }
}

export function applySecurityHeadersToResponse(res: NextResponse): NextResponse {
  applySecurityHeaders(res.headers)
  return res
}
