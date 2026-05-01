import { prisma } from "@/lib/prisma"
import { jsonOk } from "@/lib/workspace/server/http"
import { requireSessionUserId } from "@/lib/workspace/server/session"

export const dynamic = "force-dynamic"

/** Mark all unread notifications for the current user as read. */
export async function POST() {
  const userId = await requireSessionUserId()
  if (userId instanceof Response) return userId

  const now = new Date()
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: now, updatedAt: now },
  })

  return jsonOk({ updated: result.count })
}
