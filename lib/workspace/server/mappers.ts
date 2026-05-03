import type { Prisma } from "@/lib/generated/prisma"
import type { GridWidget } from "@/components/dashboard/layouts"
import type {
  DashboardComment,
  DashboardContextState,
  DashboardShare,
  Notification,
  NotificationCategory,
  PermissionRequest,
  ShareLink,
  WorkspaceDashboard,
  WorkspaceFolder,
} from "@/lib/workspace/types"

export function mapFolder(row: {
  id: string
  ownerUserId: string
  parentFolderId: string | null
  name: string
  createdAt: Date
  updatedAt: Date
}): WorkspaceFolder {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    parentFolderId: row.parentFolderId,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function parseWidgets(json: Prisma.JsonValue): GridWidget[] {
  if (!Array.isArray(json)) return []
  return json as unknown as GridWidget[]
}

function parseContext(json: Prisma.JsonValue | null | undefined): DashboardContextState | null {
  if (json === null || json === undefined) return null
  if (typeof json !== "object" || Array.isArray(json)) return null
  return json as unknown as DashboardContextState
}

export function mapShare(row: {
  id: string
  dashboardId: string
  sharedByUserId: string
  sharedWithUserId: string
  permission: "view" | "comment" | "edit"
  message: string | null
  notifyOnFirstView: boolean
  firstViewedAt: Date | null
  revokedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): DashboardShare {
  return {
    id: row.id,
    dashboardId: row.dashboardId,
    sharedByUserId: row.sharedByUserId,
    sharedWithUserId: row.sharedWithUserId,
    permission: row.permission,
    message: row.message,
    notifyOnFirstView: row.notifyOnFirstView,
    firstViewedAt: row.firstViewedAt?.toISOString() ?? null,
    revokedAt: row.revokedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function mapDashboard(row: {
  id: string
  equipmentId: string
  name: string
  lifecycleStatus: "created" | "published"
  ownerUserId: string
  contributorUserIds: string[]
  folderId: string | null
  sourceDashboardId: string | null
  widgets: Prisma.JsonValue
  thumbnailUrl: string | null
  knowledgePackVersion: string | null
  dashboardContext: Prisma.JsonValue | null
  lastChangeAt: Date
  lastChangeByUserId: string | null
  publishedAt: Date | null
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): WorkspaceDashboard {
  return {
    id: row.id,
    equipmentId: row.equipmentId,
    name: row.name,
    lifecycleStatus: row.lifecycleStatus,
    ownerUserId: row.ownerUserId,
    contributorUserIds: [...row.contributorUserIds],
    folderId: row.folderId,
    sourceDashboardId: row.sourceDashboardId,
    thumbnailUrl: row.thumbnailUrl,
    lastChangeAt: row.lastChangeAt.toISOString(),
    lastChangeByUserId: row.lastChangeByUserId,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    widgets: parseWidgets(row.widgets),
    knowledgePackVersion: row.knowledgePackVersion,
    dashboardContext: parseContext(row.dashboardContext),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function mapShareLink(row: {
  id: string
  dashboardId: string
  createdByUserId: string
  token: string
  permission: "view" | "comment" | "edit"
  revokedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): ShareLink {
  return {
    id: row.id,
    dashboardId: row.dashboardId,
    createdByUserId: row.createdByUserId,
    token: row.token,
    permission: row.permission,
    revokedAt: row.revokedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function mapComment(row: {
  id: string
  dashboardId: string
  authorUserId: string
  body: string
  createdAt: Date
  updatedAt: Date
}): DashboardComment {
  return {
    id: row.id,
    dashboardId: row.dashboardId,
    authorUserId: row.authorUserId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function mapPermissionRequest(row: {
  id: string
  dashboardId: string
  requestedByUserId: string
  requestedToUserId: string
  requestedPermission: "comment" | "edit"
  status: "pending" | "granted" | "denied" | "cancelled"
  message: string | null
  resolvedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): PermissionRequest {
  return {
    id: row.id,
    dashboardId: row.dashboardId,
    requestedByUserId: row.requestedByUserId,
    requestedToUserId: row.requestedToUserId,
    requestedPermission: row.requestedPermission,
    status: row.status,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function mapNotification(row: {
  id: string
  userId: string
  category: NotificationCategory
  dashboardId: string | null
  relatedShareId: string | null
  relatedRequestId: string | null
  actorUserId: string | null
  title: string
  body: string | null
  actionHref?: string | null
  readAt: Date | null
  archivedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}): Notification {
  return {
    id: row.id,
    userId: row.userId,
    category: row.category,
    dashboardId: row.dashboardId,
    relatedShareId: row.relatedShareId,
    relatedRequestId: row.relatedRequestId,
    actorUserId: row.actorUserId,
    title: row.title,
    body: row.body,
    actionHref: row.actionHref ?? null,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
