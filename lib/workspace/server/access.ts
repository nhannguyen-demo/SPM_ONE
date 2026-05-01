import type { SharePermission } from "@/lib/generated/prisma"
import { prisma } from "@/lib/prisma"

export type DashboardAccess = "none" | "view" | "comment" | "edit" | "owner"

function accessRank(a: DashboardAccess): number {
  switch (a) {
    case "none":
      return -1
    case "view":
      return 0
    case "comment":
      return 1
    case "edit":
      return 2
    case "owner":
      return 3
    default:
      return -1
  }
}

/** Whether `access` meets at least `min` (for shares: view < comment < edit; owner always passes edit-level). */
export function accessAtLeast(
  access: DashboardAccess,
  min: SharePermission | "owner"
): boolean {
  if (access === "none") return false
  if (min === "owner") return access === "owner"
  if (access === "owner") return true
  const needRank =
    min === "view" ? 0 : min === "comment" ? 1 : 2
  return accessRank(access) >= needRank
}

/** Owner, or highest active share permission for this user. */
export async function getDashboardAccess(
  userId: string,
  dashboardId: string
): Promise<DashboardAccess> {
  const d = await prisma.dashboard.findFirst({
    where: { id: dashboardId },
    select: {
      ownerUserId: true,
      shares: {
        where: { sharedWithUserId: userId, revokedAt: null },
        select: { permission: true },
        take: 1,
      },
    },
  })
  if (!d) return "none"
  if (d.ownerUserId === userId) return "owner"
  const perm = d.shares[0]?.permission
  if (perm === "edit") return "edit"
  if (perm === "comment") return "comment"
  if (perm === "view") return "view"
  return "none"
}
