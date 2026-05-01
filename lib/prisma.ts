import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@/lib/generated/prisma"
import { Pool } from "pg"

type GlobalPrisma = {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

const globalForPrisma = globalThis as unknown as GlobalPrisma

/** Supabase direct DB host is often IPv6-only; IPv4 / Vercel need the pooler URI. */
function assertDatabaseUrlReachableForSpmOne(url: string): void {
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
  const url = process.env.DATABASE_URL
  if (!url?.startsWith("postgres")) {
    throw new Error(
      "DATABASE_URL must be a PostgreSQL URL (postgresql:// or postgres://), e.g. from Supabase."
    )
  }

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
