import type { SharePermission, WorkspaceDashboard } from "@/lib/workspace/types"
import { permissionAtLeast } from "@/lib/workspace/types"

export function isDashboardOwner(
  dashboard: WorkspaceDashboard,
  userId: string
): boolean {
  return dashboard.ownerUserId === userId
}

export function canCommentOnDashboard(
  myPermission: SharePermission | null,
  isOwner: boolean
): boolean {
  return isOwner || permissionAtLeast(myPermission, "comment")
}

export function canEditOnDashboard(
  myPermission: SharePermission | null,
  isOwner: boolean
): boolean {
  return isOwner || permissionAtLeast(myPermission, "edit")
}

/** Only the dashboard owner may execute publish / unpublish. */
export function canPublishOnDashboard(
  dashboard: WorkspaceDashboard,
  userId: string
): boolean {
  return dashboard.ownerUserId === userId
}

export function canShareOnDashboard(
  myPermission: SharePermission | null,
  isOwner: boolean
): boolean {
  return canEditOnDashboard(myPermission, isOwner)
}
