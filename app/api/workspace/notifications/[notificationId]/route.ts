import { Prisma } from "@/lib/generated/prisma"
import { prisma } from "@/lib/prisma"
import { mapNotification } from "@/lib/workspace/server/mappers"
import { jsonErr, jsonOk } from "@/lib/workspace/server/http"
import { requireSessionUserId } from "@/lib/workspace/server/session"

export const dynamic = "force-dynamic"

type PatchBody = {
  read?: boolean
  archived?: boolean
}

/** Update one notification for the signed-in recipient (read, archive, restore). */
export async function PATCH(req: Request, ctx: { params: Promise<{ notificationId: string }> }) {
  const userId = await requireSessionUserId()
  if (userId instanceof Response) return userId
  const { notificationId } = await ctx.params

  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  })
  if (!existing) return jsonErr("Notification not found", 404)

  let body: PatchBody = {}
  try {
    const text = await req.text()
    if (text) {
      const parsed = JSON.parse(text) as unknown
      if (parsed && typeof parsed === "object") body = parsed as PatchBody
    }
  } catch {
    return jsonErr("Invalid JSON body", 400)
  }

  const data: Prisma.NotificationUpdateInput = {}
  if (body.read === true) data.readAt = new Date()
  if (body.archived === true) data.archivedAt = new Date()
  if (body.archived === false) data.archivedAt = null

  if (Object.keys(data).length === 0) {
    data.readAt = new Date()
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data,
  })

  return jsonOk(mapNotification(updated))
}

/** Permanently delete one notification for the signed-in recipient. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ notificationId: string }> }) {
  const userId = await requireSessionUserId()
  if (userId instanceof Response) return userId
  const { notificationId } = await ctx.params

  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  })
  if (!existing) return jsonErr("Notification not found", 404)

  await prisma.notification.delete({ where: { id: notificationId } })
  return jsonOk({ deleted: true })
}
