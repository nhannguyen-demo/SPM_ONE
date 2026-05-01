import { prisma } from "@/lib/prisma"
import {
  mapComment,
  mapDashboard,
  mapFolder,
  mapNotification,
  mapPermissionRequest,
  mapShare,
  mapShareLink,
} from "@/lib/workspace/server/mappers"
import { jsonOk } from "@/lib/workspace/server/http"
import { requireSessionUserId } from "@/lib/workspace/server/session"

export const dynamic = "force-dynamic"

/**
 * Workspace shell: folders, dashboards, shares, share links (owned dashboards),
 * comments on accessible dashboards, permission requests involving the user,
 * and notifications for the user.
 */
export async function GET() {
  const userId = await requireSessionUserId()
  if (userId instanceof Response) return userId

  const dashboards = await prisma.dashboard.findMany({
    where: {
      deletedAt: null,
      OR: [
        { ownerUserId: userId },
        { shares: { some: { sharedWithUserId: userId, revokedAt: null } } },
      ],
    },
    orderBy: [{ updatedAt: "desc" }],
  })

  const dashIds = dashboards.map((d) => d.id)

  const [folders, shares, shareLinks, comments, permissionRequests, notifications] =
    await Promise.all([
      prisma.workspaceFolder.findMany({
        where: { ownerUserId: userId },
        orderBy: [{ updatedAt: "desc" }],
      }),
      prisma.dashboardShare.findMany({
        where: {
          revokedAt: null,
          OR: [{ sharedWithUserId: userId }, { sharedByUserId: userId }],
        },
        orderBy: [{ updatedAt: "desc" }],
      }),
      prisma.shareLink.findMany({
        where: {
          dashboard: { ownerUserId: userId, deletedAt: null },
        },
        orderBy: [{ updatedAt: "desc" }],
      }),
      dashIds.length
        ? prisma.dashboardComment.findMany({
            where: { dashboardId: { in: dashIds } },
            orderBy: [{ createdAt: "desc" }],
          })
        : Promise.resolve([]),
      prisma.permissionRequest.findMany({
        where: {
          OR: [{ requestedByUserId: userId }, { requestedToUserId: userId }],
        },
        orderBy: [{ updatedAt: "desc" }],
      }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: [{ createdAt: "desc" }],
        take: 300,
      }),
    ])

  return jsonOk({
    folders: folders.map(mapFolder),
    dashboards: dashboards.map(mapDashboard),
    shares: shares.map(mapShare),
    shareLinks: shareLinks.map(mapShareLink),
    comments: comments.map(mapComment),
    permissionRequests: permissionRequests.map(mapPermissionRequest),
    notifications: notifications.map(mapNotification),
  })
}
