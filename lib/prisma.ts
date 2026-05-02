import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@/lib/generated/prisma"
import { Pool } from "pg"

type GlobalPrisma = {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

const globalForPrisma = globalThis as unknown as GlobalPrisma

/**
 * During `next build`, Next collects route data and imports server modules. Vercel
 * previews often omit `DATABASE_URL` at build time — Prisma client init must not
 * throw; the Pool does not connect until the first query.
 */
const PRISMA_BUILD_PLACEHOLDER_URL =
  "postgresql://build_placeholder:build_placeholder@127.0.0.1:5432/build_placeholder?sslmode=disable"

function isNextProductionBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build"
}

/** Read env without a literal `process.env.DATABASE_URL` reference (avoids some bundlers inlining build-time values into server chunks). */
function envString(name: string): string | undefined {
  const v = process.env[name]
  return typeof v === "string" ? v : undefined
}

/** Strip wrapping quotes often pasted from `.env` examples into the Vercel UI. */
function unwrapEnvString(raw: string): string {
  let s = raw.trim()
  if (s.length >= 2) {
    const q = s[0]
    if ((q === '"' || q === "'") && s[s.length - 1] === q) {
      s = s.slice(1, -1).trim()
    }
  }
  return s
}

function isValidPostgresUrl(url: string): boolean {
  return /^postgres(ql)?:\/\//i.test(url.trim())
}

/**
 * Prefer `DATABASE_URL`; fall back to Vercel / platform Postgres vars when the app
 * is wired to the Vercel Postgres integration (those use `POSTGRES_URL` / `POSTGRES_PRISMA_URL`).
 */
function pickPostgresConnectionString(): string | undefined {
  const keys = [
    "DATABASE" + "_" + "URL",
    "POSTGRES" + "_" + "URL",
    "POSTGRES" + "_" + "PRISMA" + "_" + "URL",
  ]
  for (const key of keys) {
    const raw = envString(key)
    if (!raw) continue
    const u = unwrapEnvString(raw)
    if (isValidPostgresUrl(u)) return u.trim()
  }
  return undefined
}

function resolveDatabaseUrl(): string {
  const url = pickPostgresConnectionString()
  if (url) return url

  const building =
    isNextProductionBuildPhase() ||
    process.env.npm_lifecycle_event === "build"

  if (building) {
    return PRISMA_BUILD_PLACEHOLDER_URL
  }

  const onVercel = process.env.VERCEL === "1"
  const hint = onVercel
    ? " On Vercel: open the deployment → Settings → Environment Variables, and ensure DATABASE_URL (Session pooler URI) is set for **this** environment (Preview vs Production), then redeploy. If the value was wrapped in quotes in the UI, remove them."
    : ""

  throw new Error(
    "DATABASE_URL must be a PostgreSQL URL (postgresql:// or postgres://), e.g. from Supabase." +
      hint
  )
}

/** Supabase direct DB host is often IPv6-only; IPv4 / Vercel need the pooler URI. */
function assertDatabaseUrlReachableForSpmOne(url: string): void {
  if (url === PRISMA_BUILD_PLACEHOLDER_URL) return
  if (process.env.SPM_ALLOW_SUPABASE_DIRECT === "1") return
  if (!url.includes(".supabase.co")) return
  if (/@db\.[a-z0-9-]+\.supabase\.co/i.test(url)) {
    throw new Error(
      "DATABASE_URL uses Supabase's direct host (db.<ref>.supabase.co). That host is often unreachable from IPv4-only networks (and from Vercel), so Prisma fails with P1001 and login breaks.\n\n" +
        "Fix: Supabase → Project Settings → Database → use the Session pooler connection URI (host like *.pooler.supabase.com), not the \"Direct connection\" string.\n\n" +
        "Optional: SPM_ALLOW_SUPABASE_DIRECT=1 skips this check (not recommended)."
    )
  }
}

function createPrismaClient(): PrismaClient {
  const url = resolveDatabaseUrl()
  assertDatabaseUrlReachableForSpmOne(url)

  const pool = globalForPrisma.pool ?? new Pool({ connectionString: url })
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool
  }

  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
