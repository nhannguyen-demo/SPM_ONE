import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { mapShare } from "@/lib/workspace/server/mappers"
import { jsonErr, jsonOk } from "@/lib/workspace/server/http"
import { requireSessionUserId } from "@/lib/workspace/server/session"

export const dynamic = "force-dynamic"

const bodySchema = z.object({ token: z.string().min(1) })

/**
 * Redeem a non-revoked share link: upserts a DashboardShare for the current user
 * (owner is sharedBy). Does not send a duplicate "shared with you" notification.
 */
export async function POST(req: Request) {
  const userId = await requireSessionUserId()
  if (userId instanceof Response) return userId

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonErr("Invalid JSON", 400)
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return jsonErr(parsed.error.message, 400)

  const token = parsed.data.token.trim()

  const link = await prisma.shareLink.findFirst({
    where: {
      token,
      revokedAt: null,
      dashboard: { deletedAt: null },
    },
    include: {
      dashboard: { select: { id: true, ownerUserId: true } },
    },
  })
  if (!link) return jsonErr("Link not found or revoked", 404)

  const ownerId = link.dashboard.ownerUserId
  if (ownerId === userId) {
    const existingOwnerShare = await prisma.dashboardShare.findFirst({
      where: {
        dashboardId: link.dashboardId,
        sharedWithUserId: userId,
        revokedAt: null,
      },
    })
    if (existingOwnerShare) return jsonOk(mapShare(existingOwnerShare))
    return jsonErr("Owner does not need a share record", 400)
  }

  const existing = await prisma.dashboardShare.findFirst({
    where: {
      dashboardId: link.dashboardId,
      sharedWithUserId: userId,
      revokedAt: null,
    },
  })

  const share = existing
    ? await prisma.dashboardShare.update({
        where: { id: existing.id },
        data: {
          permission: link.permission,
          sharedByUserId: ownerId,
        },
      })
    : await prisma.dashboardShare.create({
        data: {
          dashboardId: link.dashboardId,
          sharedByUserId: ownerId,
          sharedWithUserId: userId,
          permission: link.permission,
          message: null,
          notifyOnFirstView: false,
        },
      })

  return jsonOk(mapShare(share), { status: existing ? 200 : 201 })
}
