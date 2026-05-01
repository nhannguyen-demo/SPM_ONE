import { randomBytes } from "node:crypto"
import { prisma } from "@/lib/prisma"
import { mapShareLink } from "@/lib/workspace/server/mappers"
import { jsonErr, jsonOk } from "@/lib/workspace/server/http"
import { requireSessionUserId } from "@/lib/workspace/server/session"

export const dynamic = "force-dynamic"

function genToken(): string {
  return randomBytes(18).toString("base64url").slice(0, 32)
}

/** Owner rotates token and clears revocation. */
export async function POST(_req: Request, ctx: { params: Promise<{ linkId: string }> }) {
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
    data: {
      token: genToken(),
      revokedAt: null,
    },
  })

  return jsonOk(mapShareLink(updated))
}
