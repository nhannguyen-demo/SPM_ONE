import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { mapShare } from "@/lib/workspace/server/mappers"
import { jsonErr, jsonOk } from "@/lib/workspace/server/http"
import { requireSessionUserId } from "@/lib/workspace/server/session"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  dashboardId: z.string().min(1),
  sharedWithUserId: z.string().min(1),
  permission: z.enum(["view", "comment", "edit"]),
  message: z.string().max(500).nullable().optional(),
  notifyOnFirstView: z.boolean().optional(),
})

/** Owner-only: create or update an active share with a user; notifies recipient. */
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

  const { dashboardId, sharedWithUserId, permission, message, notifyOnFirstView } = parsed.data

  if (sharedWithUserId === userId) {
    return jsonErr("Cannot share with yourself", 400)
  }

  const dashboard = await prisma.dashboard.findFirst({
    where: { id: dashboardId, deletedAt: null },
    select: { id: true, name: true, ownerUserId: true },
  })
  if (!dashboard) return jsonErr("Dashboard not found", 404)
  if (dashboard.ownerUserId !== userId) return jsonErr("Forbidden", 403)

  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })

  const existing = await prisma.dashboardShare.findFirst({
    where: {
      dashboardId,
      sharedWithUserId,
      revokedAt: null,
    },
  })

  const share = existing
    ? await prisma.dashboardShare.update({
        where: { id: existing.id },
        data: {
          permission,
          message: message ?? existing.message,
          notifyOnFirstView: notifyOnFirstView ?? existing.notifyOnFirstView,
        },
      })
    : await prisma.dashboardShare.create({
        data: {
          dashboardId,
          sharedByUserId: userId,
          sharedWithUserId,
          permission,
          message: message ?? null,
          notifyOnFirstView: !!notifyOnFirstView,
        },
      })

  await prisma.notification.create({
    data: {
      userId: sharedWithUserId,
      category: "dashboard_shared_with_you",
      dashboardId,
      relatedShareId: share.id,
      actorUserId: userId,
      title: `${actor?.name ?? "Someone"} shared '${dashboard.name}' with you`,
      body: `Permission: ${permission}${message ? ` · "${message}"` : ""}`,
    },
  })

  return jsonOk(mapShare(share), { status: existing ? 200 : 201 })
}
