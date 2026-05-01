import { prisma } from "@/lib/prisma"
import { mapDashboard } from "@/lib/workspace/server/mappers"
import { jsonErr, jsonOk } from "@/lib/workspace/server/http"
import { requireSessionUserId } from "@/lib/workspace/server/session"

export const dynamic = "force-dynamic"

export async function POST(_req: Request, ctx: { params: Promise<{ dashboardId: string }> }) {
  const userId = await requireSessionUserId()
  if (userId instanceof Response) return userId
  const { dashboardId } = await ctx.params

  const existing = await prisma.dashboard.findFirst({
    where: { id: dashboardId },
  })
  if (!existing) return jsonErr("Not found", 404)
  if (existing.ownerUserId !== userId) return jsonErr("Forbidden", 403)
  if (!existing.deletedAt) return jsonErr("Dashboard is not in trash", 400)

  const row = await prisma.dashboard.update({
    where: { id: dashboardId },
    data: { deletedAt: null },
  })

  return jsonOk(mapDashboard(row))
}
