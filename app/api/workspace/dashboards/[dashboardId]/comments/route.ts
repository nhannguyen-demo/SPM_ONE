import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { accessAtLeast, getDashboardAccess } from "@/lib/workspace/server/access"
import { mapComment } from "@/lib/workspace/server/mappers"
import { jsonErr, jsonOk } from "@/lib/workspace/server/http"
import { requireSessionUserId } from "@/lib/workspace/server/session"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  body: z.string().min(1).max(2000),
})

/** Requires at least comment-level access on the dashboard. */
export async function POST(req: Request, ctx: { params: Promise<{ dashboardId: string }> }) {
  const userId = await requireSessionUserId()
  if (userId instanceof Response) return userId
  const { dashboardId } = await ctx.params

  const dash = await prisma.dashboard.findFirst({
    where: { id: dashboardId, deletedAt: null },
  })
  if (!dash) return jsonErr("Dashboard not found", 404)

  const access = await getDashboardAccess(userId, dashboardId)
  if (!accessAtLeast(access, "comment")) return jsonErr("Forbidden", 403)

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return jsonErr("Invalid JSON", 400)
  }
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) return jsonErr(parsed.error.message, 400)

  const row = await prisma.dashboardComment.create({
    data: {
      dashboardId,
      authorUserId: userId,
      body: parsed.data.body.trim(),
    },
  })

  return jsonOk(mapComment(row), { status: 201 })
}
