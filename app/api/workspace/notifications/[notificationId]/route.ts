import { prisma } from "@/lib/prisma"
import { mapNotification } from "@/lib/workspace/server/mappers"
import { jsonErr, jsonOk } from "@/lib/workspace/server/http"
import { requireSessionUserId } from "@/lib/workspace/server/session"

export const dynamic = "force-dynamic"

/** Mark one notification as read (recipient only). */
export async function PATCH(_req: Request, ctx: { params: Promise<{ notificationId: string }> }) {
  const userId = await requireSessionUserId()
  if (userId instanceof Response) return userId
  const { notificationId } = await ctx.params

  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  })
  if (!existing) return jsonErr("Notification not found", 404)

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  })

  return jsonOk(mapNotification(updated))
}
