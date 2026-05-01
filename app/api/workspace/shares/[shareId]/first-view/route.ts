import { prisma } from "@/lib/prisma"
import { mapShare } from "@/lib/workspace/server/mappers"
import { jsonErr, jsonOk } from "@/lib/workspace/server/http"
import { requireSessionUserId } from "@/lib/workspace/server/session"

export const dynamic = "force-dynamic"

/** Recipient records first view; optional notification to sharer when notifyOnFirstView. */
export async function POST(_req: Request, ctx: { params: Promise<{ shareId: string }> }) {
  const userId = await requireSessionUserId()
  if (userId instanceof Response) return userId
  const { shareId } = await ctx.params

  const shareRow = await prisma.dashboardShare.findUnique({
    where: { id: shareId },
  })
  if (!shareRow) return jsonErr("Share not found", 404)
  if (shareRow.sharedWithUserId !== userId) return jsonErr("Forbidden", 403)
  if (shareRow.revokedAt) return jsonErr("Share revoked", 400)

  if (shareRow.firstViewedAt) {
    return jsonOk(mapShare(shareRow))
  }

  const dash = await prisma.dashboard.findUnique({
    where: { id: shareRow.dashboardId },
    select: { name: true },
  })

  const viewer = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })

  const updated = await prisma.dashboardShare.update({
    where: { id: shareId },
    data: { firstViewedAt: new Date() },
  })

  if (shareRow.notifyOnFirstView) {
    await prisma.notification.create({
      data: {
        userId: shareRow.sharedByUserId,
        category: "dashboard_first_view",
        dashboardId: shareRow.dashboardId,
        relatedShareId: shareRow.id,
        actorUserId: userId,
        title: `${viewer?.name ?? "Someone"} viewed '${dash?.name ?? "Dashboard"}' for the first time`,
        body: null,
      },
    })
  }

  return jsonOk(mapShare(updated))
}
