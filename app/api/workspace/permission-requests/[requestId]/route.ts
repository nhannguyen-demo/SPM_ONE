import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { mapPermissionRequest } from "@/lib/workspace/server/mappers"
import { jsonErr, jsonOk } from "@/lib/workspace/server/http"
import { requireSessionUserId } from "@/lib/workspace/server/session"

export const dynamic = "force-dynamic"

const patchSchema = z
  .object({
    status: z.enum(["granted", "denied", "cancelled"]),
  })
  .strict()

/** Dashboard owner (requestedToUserId) resolves a pending request. */
export async function PATCH(req: Request, ctx: { params: Promise<{ requestId: string }> }) {
  const userId = await requireSessionUserId()
  if (userId instanceof Response) return userId
  const { requestId } = await ctx.params

  const reqRow = await prisma.permissionRequest.findFirst({
    where: { id: requestId },
    include: {
      dashboard: { select: { id: true, name: true, ownerUserId: true } },
    },
  })
  if (!reqRow) return jsonErr("Request not found", 404)
  if (reqRow.requestedToUserId !== userId) return jsonErr("Forbidden", 403)
  if (reqRow.status !== "pending") return jsonErr("Request is not pending", 400)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonErr("Invalid JSON", 400)
  }
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return jsonErr(parsed.error.message, 400)

  const resolvedAt = new Date()
  const status = parsed.data.status

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.permissionRequest.update({
      where: { id: requestId },
      data: {
        status,
        resolvedAt,
      },
    })

    if (status === "granted") {
      const existing = await tx.dashboardShare.findFirst({
        where: {
          dashboardId: reqRow.dashboardId,
          sharedWithUserId: reqRow.requestedByUserId,
          revokedAt: null,
        },
      })
      if (existing) {
        await tx.dashboardShare.update({
          where: { id: existing.id },
          data: { permission: reqRow.requestedPermission },
        })
      } else {
        await tx.dashboardShare.create({
          data: {
            dashboardId: reqRow.dashboardId,
            sharedByUserId: reqRow.dashboard.ownerUserId,
            sharedWithUserId: reqRow.requestedByUserId,
            permission: reqRow.requestedPermission,
            message: null,
            notifyOnFirstView: false,
          },
        })
      }
    }

    const resolver = await tx.user.findUnique({
      where: { id: userId },
      select: { name: true },
    })

    await tx.notification.create({
      data: {
        userId: reqRow.requestedByUserId,
        category: "permission_request_resolved",
        dashboardId: reqRow.dashboardId,
        relatedRequestId: reqRow.id,
        actorUserId: userId,
        title: `${resolver?.name ?? "Someone"} ${status} your ${reqRow.requestedPermission} access request on '${reqRow.dashboard.name}'`,
        body: null,
      },
    })

    return u
  })

  return jsonOk(mapPermissionRequest(updated))
}
