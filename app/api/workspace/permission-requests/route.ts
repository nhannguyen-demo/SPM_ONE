import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getDashboardAccess } from "@/lib/workspace/server/access"
import { mapPermissionRequest } from "@/lib/workspace/server/mappers"
import { jsonErr, jsonOk } from "@/lib/workspace/server/http"
import { requireSessionUserId } from "@/lib/workspace/server/session"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  dashboardId: z.string().min(1),
  requestedPermission: z.enum(["comment", "edit"]),
  message: z.string().max(2000).nullable().optional(),
})

/** Non-owner with dashboard access may request elevated permission. */
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

  const { dashboardId, requestedPermission, message } = parsed.data

  const dashboard = await prisma.dashboard.findFirst({
    where: { id: dashboardId, deletedAt: null },
    select: { id: true, name: true, ownerUserId: true },
  })
  if (!dashboard) return jsonErr("Dashboard not found", 404)
  if (dashboard.ownerUserId === userId) {
    return jsonErr("Owner cannot request permission on own dashboard", 400)
  }

  const access = await getDashboardAccess(userId, dashboardId)
  if (access === "none") return jsonErr("Forbidden", 403)

  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })

  const row = await prisma.permissionRequest.create({
    data: {
      dashboardId,
      requestedByUserId: userId,
      requestedToUserId: dashboard.ownerUserId,
      requestedPermission,
      status: "pending",
      message: message?.trim() || null,
    },
  })

  await prisma.notification.create({
    data: {
      userId: dashboard.ownerUserId,
      category: "permission_request_received",
      dashboardId,
      relatedRequestId: row.id,
      actorUserId: userId,
      title: `${actor?.name ?? "Someone"} requested ${requestedPermission} access on '${dashboard.name}'`,
      body: row.message,
    },
  })

  return jsonOk(mapPermissionRequest(row), { status: 201 })
}
