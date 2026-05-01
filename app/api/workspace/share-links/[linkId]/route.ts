import { prisma } from "@/lib/prisma"
import { mapShareLink } from "@/lib/workspace/server/mappers"
import { jsonErr, jsonOk } from "@/lib/workspace/server/http"
import { requireSessionUserId } from "@/lib/workspace/server/session"

export const dynamic = "force-dynamic"

/** Owner revokes a share link (sets revokedAt). */
export async function PATCH(req: Request, ctx: { params: Promise<{ linkId: string }> }) {
  const userId = await requireSessionUserId()
  if (userId instanceof Response) return userId
  const { linkId } = await ctx.params

  const link = await prisma.shareLink.findFirst({
    where: { id: linkId },
    include: { dashboard: { select: { ownerUserId: true } } },
  })
  if (!link) return jsonErr("Link not found", 404)
  if (link.dashboard.ownerUserId !== userId) return jsonErr("Forbidden", 403)

  const updated = await prisma.shareLink.update({
    where: { id: linkId },
    data: { revokedAt: new Date() },
  })

  return jsonOk(mapShareLink(updated))
}
