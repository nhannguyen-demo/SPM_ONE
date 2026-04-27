/**
 * Workspace + Comms domain types.
 *
 * These mirror the canonical entities in domain.ontology.yaml. They are the
 * single source of truth for the Workspace Module, Sharing, Comments,
 * Permission Requests, Notifications, and the cross-tab Full-Screen Viewer.
 *
 * ⚠️  Do not import this file from the legacy Equipment Dashboard editor —
 *     these types are scoped to the Workspace surface.
 */

import type { GridWidget } from "@/components/views/equipment-dashboard/layouts"

/* ─── Identity ─────────────────────────────────────────────────────────────── */

export type UserRole = "integrity_engineer" | "process_engineer" | "admin"

export interface OrgUser {
  id: string
  name: string
  email: string
  /** Avatar shorthand (initials) used by lightweight avatar chips. */
  initials: string
  /** Optional avatar image URL (mock; may be undefined). */
  avatarUrl?: string
  role: UserRole
  /** Mock-only flag; exactly one OrgUser carries this at any time. */
  isCurrentUser?: boolean
}

/* ─── Workspace ────────────────────────────────────────────────────────────── */

export type DashboardLifecycleStatus = "created" | "published"

/** Granted permission for a DashboardShare or ShareLink. view < comment < edit. */
export type SharePermission = "view" | "comment" | "edit"

export interface WorkspaceFolder {
  id: string
  ownerUserId: string
  parentFolderId: string | null
  name: string
  createdAt: string
  updatedAt: string
}

/**
 * A Workspace dashboard. Extends the legacy Dashboard concept with
 * lifecycle, ownership, contributors, folder placement, screenshots,
 * and audit timestamps used by the Workspace CMS.
 */
export interface WorkspaceDashboard {
  id: string
  /** The equipment this dashboard was created for. Cannot change after creation. */
  equipmentId: string
  /** Display name. Unique per (equipment, owner) in the Workspace. */
  name: string
  /** Workspace lifecycle: 'created' (draft) or 'published' (also visible in Asset Module). */
  lifecycleStatus: DashboardLifecycleStatus
  /** Sole owner / creator. */
  ownerUserId: string
  /** Users (≠ owner) who saved at least one edit while holding edit permission. */
  contributorUserIds: string[]
  /** Workspace folder this dashboard lives in (null = workspace root). */
  folderId: string | null
  /** Optional clone source. */
  sourceDashboardId?: string | null
  /** Generated screenshot data URI / path (mock). */
  thumbnailUrl?: string | null
  /** Last save timestamp (ISO). */
  lastChangeAt: string
  lastChangeByUserId: string | null
  /** Set when lifecycleStatus first transitions to 'published'. */
  publishedAt: string | null
  /** Soft-delete; null = active. */
  deletedAt: string | null
  /** Widget grid layout (compatible with legacy dashboard editor). */
  widgets: GridWidget[]
  createdAt: string
  updatedAt: string
}

/* ─── Sharing ──────────────────────────────────────────────────────────────── */

export interface DashboardShare {
  id: string
  dashboardId: string
  sharedByUserId: string
  sharedWithUserId: string
  permission: SharePermission
  message: string | null
  /** Sharer opted into "notify me when they first view this dashboard". */
  notifyOnFirstView: boolean
  /** First time the recipient opened this dashboard's popup. */
  firstViewedAt: string | null
  revokedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ShareLink {
  id: string
  dashboardId: string
  createdByUserId: string
  /** Unique opaque token used in /share/[token]. */
  token: string
  permission: SharePermission
  revokedAt: string | null
  createdAt: string
  updatedAt: string
}

/* ─── Comments + Permission Requests ───────────────────────────────────────── */

export interface DashboardComment {
  id: string
  dashboardId: string
  authorUserId: string
  body: string
  createdAt: string
  updatedAt: string
}

export type PermissionRequestStatus = "pending" | "granted" | "denied" | "cancelled"

export interface PermissionRequest {
  id: string
  dashboardId: string
  requestedByUserId: string
  /** Typically the dashboard owner. */
  requestedToUserId: string
  /** view is the implicit baseline; only comment/edit are requestable. */
  requestedPermission: Exclude<SharePermission, "view">
  status: PermissionRequestStatus
  resolvedAt: string | null
  /** Optional message from requester. */
  message: string | null
  createdAt: string
  updatedAt: string
}

/* ─── Notifications (Comms) ────────────────────────────────────────────────── */

export type NotificationCategory =
  | "dashboard_shared_with_you"
  | "dashboard_first_view"
  | "permission_request_received"
  | "permission_request_resolved"
  | "edit_lock_blocked"

export interface Notification {
  id: string
  /** Recipient. */
  userId: string
  category: NotificationCategory
  dashboardId: string | null
  relatedShareId: string | null
  relatedRequestId: string | null
  /** Originator of the action. */
  actorUserId: string | null
  title: string
  body: string | null
  /** Null = unread. */
  readAt: string | null
  createdAt: string
  updatedAt: string
}

/* ─── Cross-tab presence ───────────────────────────────────────────────────── */

/** Live, in-memory representation of one Full-Screen Viewer tab. */
export interface DashboardViewerTabSession {
  sessionId: string
  dashboardId: string
  userId: string | null
  openedAt: string
  lastHeartbeatAt: string
}

/* ─── Workspace UI helpers ─────────────────────────────────────────────────── */

/** Virtual locations rendered above the user's folder tree. */
export type WorkspaceVirtualLocation =
  | "all"
  | "shared"
  | "recent"
  | "trash"

export type DashboardSortKey =
  | "lastChange"
  | "name"
  | "created"
  | "equipment"

export type DashboardSortDir = "asc" | "desc"

export interface WorkspaceFilters {
  /** equipmentId or "" for any. */
  equipmentId: string
  /** "" for any. */
  status: "" | DashboardLifecycleStatus
  /** ownerUserId or "" for any. */
  creatorUserId: string
  /** contributorUserId or "" for any. */
  contributorUserId: string
  /** ISO date or "" — inclusive lower bound on lastChangeAt. */
  changedFrom: string
  /** ISO date or "" — inclusive upper bound on lastChangeAt. */
  changedTo: string
}

export const EMPTY_FILTERS: WorkspaceFilters = {
  equipmentId: "",
  status: "",
  creatorUserId: "",
  contributorUserId: "",
  changedFrom: "",
  changedTo: "",
}

export interface DashboardCardMetadata {
  dashboard: WorkspaceDashboard
  owner: OrgUser | null
  contributors: OrgUser[]
  equipmentName: string
  folderName: string | null
  /**
   * For "Shared with me" cards: the active (non-revoked) share record giving
   * this user access. Null on owner-owned cards.
   */
  share: DashboardShare | null
}

/**
 * Permission ordering helper. view < comment < edit.
 */
export const PERMISSION_RANK: Record<SharePermission, number> = {
  view: 0,
  comment: 1,
  edit: 2,
}

export function permissionAtLeast(
  granted: SharePermission | null | undefined,
  required: SharePermission,
): boolean {
  if (!granted) return false
  return PERMISSION_RANK[granted] >= PERMISSION_RANK[required]
}
