/**
 * Workspace Module Zustand store.
 *
 * Holds folders, dashboards, shares, links, comments, permission requests,
 * notifications, and Workspace UI state (filters/sort/search/recent/selection).
 * Persisted to localStorage so reloads preserve workspace state. Exposes a
 * `resetWorkspace()` action that re-seeds.
 */

"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { GridWidget } from "@/components/dashboard/layouts"
import type {
  CatalogParameterRequest,
  DashboardComment,
  DashboardContextState,
  DashboardLifecycleStatus,
  DashboardShare,
  DashboardSortDir,
  DashboardSortKey,
  Notification,
  NotificationCategory,
  PermissionRequest,
  PermissionRequestStatus,
  SharePermission,
  ShareLink,
  WorkspaceDashboard,
  WorkspaceFilters,
  WorkspaceFolder,
} from "./types"
import { EMPTY_FILTERS } from "./types"
import { ORG_USERS, findOrgUserById, getCurrentUserId } from "./identity"
import { WORKSPACE_SEED } from "./seed"
import { generateDashboardThumbnail } from "./thumbnail"
import { getEquipmentTypeKey } from "@/lib/data"
import { COKER_V1_VERSION } from "@/lib/equipment-packs/coker-v1"

const RECENT_LIMIT = 20
const TRASH_TTL_DAYS = 30

function nowIso(): string {
  return new Date().toISOString()
}

function genId(prefix: string): string {
  // Deterministic-ish: prefix + timestamp + random suffix.
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function genToken(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
}

/* ─── State + actions ──────────────────────────────────────────────────────── */

export interface WorkspaceState {
  /* ── Persistent collections ─────────────────────────────────────────────── */
  folders: WorkspaceFolder[]
  dashboards: WorkspaceDashboard[]
  shares: DashboardShare[]
  shareLinks: ShareLink[]
  comments: DashboardComment[]
  permissionRequests: PermissionRequest[]
  notifications: Notification[]
  /** LRU dashboardId list, per current user (max RECENT_LIMIT). */
  recentDashboardIds: string[]
  /** In-app requests for new catalog parameters (product team queue). */
  catalogParameterRequests: CatalogParameterRequest[]

  /* ── UI state (also persisted) ──────────────────────────────────────────── */
  searchQuery: string
  filters: WorkspaceFilters
  sortKey: DashboardSortKey
  sortDir: DashboardSortDir
  /** When set, /dashboard pre-applies this equipmentId filter on mount. */
  initialEquipmentFilter: string | null

  /* ── Actions: data lifecycle ────────────────────────────────────────────── */
  resetWorkspace: () => void

  /* ── Actions: folders ──────────────────────────────────────────────────── */
  createFolder: (input: { name: string; parentFolderId: string | null }) => WorkspaceFolder
  renameFolder: (folderId: string, name: string) => void
  moveFolder: (folderId: string, parentFolderId: string | null) => void
  deleteFolder: (folderId: string, mode: "move-to-root" | "cascade") => void

  /* ── Actions: dashboards ────────────────────────────────────────────────── */
  createDashboard: (input: {
    name: string
    equipmentId: string
    folderId: string | null
    widgets?: GridWidget[]
  }) => WorkspaceDashboard
  duplicateDashboard: (dashboardId: string) => WorkspaceDashboard | null
  renameDashboard: (dashboardId: string, name: string) => void
  moveDashboard: (dashboardId: string, folderId: string | null) => void
  saveDashboardWidgets: (dashboardId: string, widgets: GridWidget[]) => void
  saveDashboardContext: (dashboardId: string, context: DashboardContextState | null) => void
  duplicateDashboardToEquipment: (dashboardId: string, targetEquipmentId: string) => WorkspaceDashboard | null
  submitCatalogParameterRequest: (input: {
    body: string
    equipmentId: string | null
    categoryHint: string | null
  }) => CatalogParameterRequest
  updateCatalogParameterRequestStatus: (
    requestId: string,
    status: CatalogParameterRequest["status"]
  ) => void
  publishDashboard: (dashboardId: string) => void
  unpublishDashboard: (dashboardId: string) => void
  softDeleteDashboard: (dashboardId: string) => void
  restoreDashboard: (dashboardId: string) => void
  permanentlyDeleteDashboard: (dashboardId: string) => void
  recordDashboardOpened: (dashboardId: string) => void

  /* ── Actions: sharing ───────────────────────────────────────────────────── */
  shareWithUser: (input: {
    dashboardId: string
    sharedWithUserId: string
    permission: SharePermission
    message?: string
    notifyOnFirstView?: boolean
  }) => DashboardShare
  updateShare: (
    shareId: string,
    updates: { permission?: SharePermission; revokedAt?: string | null }
  ) => void
  generateShareLink: (input: {
    dashboardId: string
    permission: SharePermission
  }) => ShareLink
  revokeShareLink: (linkId: string) => void
  regenerateShareLink: (linkId: string) => ShareLink | null
  /** Marks first view; returns true if a notification was generated. */
  markShareFirstViewed: (shareId: string) => boolean

  /* ── Actions: comments ──────────────────────────────────────────────────── */
  addComment: (input: { dashboardId: string; body: string }) => DashboardComment | null

  /* ── Actions: permission requests ───────────────────────────────────────── */
  requestPermission: (input: {
    dashboardId: string
    requestedPermission: "comment" | "edit"
    message?: string
  }) => PermissionRequest | null
  resolvePermissionRequest: (
    requestId: string,
    status: Exclude<PermissionRequestStatus, "pending">
  ) => void

  /* ── Actions: notifications ─────────────────────────────────────────────── */
  pushNotification: (
    notif: Omit<Notification, "id" | "createdAt" | "updatedAt" | "readAt"> & {
      readAt?: string | null
    }
  ) => Notification
  markNotificationRead: (notificationId: string) => void
  markAllNotificationsRead: () => void

  /* ── Actions: filters & sort ────────────────────────────────────────────── */
  setSearchQuery: (q: string) => void
  setFilter: <K extends keyof WorkspaceFilters>(key: K, value: WorkspaceFilters[K]) => void
  clearFilters: () => void
  setSort: (key: DashboardSortKey, dir: DashboardSortDir) => void
  setInitialEquipmentFilter: (id: string | null) => void
}

/* ─── Store ────────────────────────────────────────────────────────────────── */

const SEED = WORKSPACE_SEED

const initialState: Omit<
  WorkspaceState,
  | "resetWorkspace"
  | "createFolder"
  | "renameFolder"
  | "moveFolder"
  | "deleteFolder"
  | "createDashboard"
  | "duplicateDashboard"
  | "renameDashboard"
  | "moveDashboard"
  | "saveDashboardWidgets"
  | "saveDashboardContext"
  | "duplicateDashboardToEquipment"
  | "submitCatalogParameterRequest"
  | "updateCatalogParameterRequestStatus"
  | "publishDashboard"
  | "unpublishDashboard"
  | "softDeleteDashboard"
  | "restoreDashboard"
  | "permanentlyDeleteDashboard"
  | "recordDashboardOpened"
  | "shareWithUser"
  | "updateShare"
  | "generateShareLink"
  | "revokeShareLink"
  | "regenerateShareLink"
  | "markShareFirstViewed"
  | "addComment"
  | "requestPermission"
  | "resolvePermissionRequest"
  | "pushNotification"
  | "markNotificationRead"
  | "markAllNotificationsRead"
  | "setSearchQuery"
  | "setFilter"
  | "clearFilters"
  | "setSort"
  | "setInitialEquipmentFilter"
> = {
  folders: SEED.folders,
  dashboards: SEED.dashboards,
  shares: SEED.shares,
  shareLinks: SEED.shareLinks,
  comments: SEED.comments,
  permissionRequests: SEED.permissionRequests,
  notifications: SEED.notifications,
  recentDashboardIds: [],
  catalogParameterRequests: [],
  searchQuery: "",
  filters: { ...EMPTY_FILTERS },
  sortKey: "lastChange",
  sortDir: "desc",
  initialEquipmentFilter: null,
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      ...initialState,

      resetWorkspace: () =>
        set({
          ...initialState,
          folders: SEED.folders,
          dashboards: SEED.dashboards,
          shares: SEED.shares,
          shareLinks: SEED.shareLinks,
          comments: SEED.comments,
          permissionRequests: SEED.permissionRequests,
          notifications: SEED.notifications,
          recentDashboardIds: [],
          searchQuery: "",
          filters: { ...EMPTY_FILTERS },
          sortKey: "lastChange",
          sortDir: "desc",
          initialEquipmentFilter: null,
          catalogParameterRequests: [],
        }),

      /* ── Folders ────────────────────────────────────────────────────────── */
      createFolder: ({ name, parentFolderId }) => {
        const folder: WorkspaceFolder = {
          id: genId("folder"),
          ownerUserId: getCurrentUserId(),
          parentFolderId,
          name: name.trim() || "Untitled folder",
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }
        set((s) => ({ folders: [...s.folders, folder] }))
        return folder
      },
      renameFolder: (folderId, name) =>
        set((s) => ({
          folders: s.folders.map((f) =>
            f.id === folderId ? { ...f, name: name.trim() || f.name, updatedAt: nowIso() } : f
          ),
        })),
      moveFolder: (folderId, parentFolderId) =>
        set((s) => ({
          folders: s.folders.map((f) =>
            f.id === folderId
              ? { ...f, parentFolderId, updatedAt: nowIso() }
              : f
          ),
        })),
      deleteFolder: (folderId, mode) =>
        set((s) => {
          const descendantIds = new Set<string>()
          const stack = [folderId]
          while (stack.length) {
            const cur = stack.pop()!
            descendantIds.add(cur)
            for (const f of s.folders) {
              if (f.parentFolderId === cur) stack.push(f.id)
            }
          }
          const folders = s.folders.filter((f) => !descendantIds.has(f.id))
          const dashboards =
            mode === "cascade"
              ? s.dashboards.map((d) =>
                  d.folderId && descendantIds.has(d.folderId)
                    ? { ...d, deletedAt: nowIso(), folderId: null, updatedAt: nowIso() }
                    : d
                )
              : s.dashboards.map((d) =>
                  d.folderId && descendantIds.has(d.folderId)
                    ? { ...d, folderId: null, updatedAt: nowIso() }
                    : d
                )
          return { folders, dashboards }
        }),

      /* ── Dashboards ────────────────────────────────────────────────────── */
      createDashboard: ({ name, equipmentId, folderId, widgets }) => {
        const id = genId("dash")
        const dash: WorkspaceDashboard = {
          id,
          equipmentId,
          name: name.trim() || "Untitled dashboard",
          lifecycleStatus: "created",
          ownerUserId: getCurrentUserId(),
          contributorUserIds: [],
          folderId,
          sourceDashboardId: null,
          thumbnailUrl: generateDashboardThumbnail(id, name, widgets ?? []),
          lastChangeAt: nowIso(),
          lastChangeByUserId: getCurrentUserId(),
          publishedAt: null,
          deletedAt: null,
          knowledgePackVersion: null,
          dashboardContext: null,
          widgets: widgets ?? [],
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }
        set((s) => ({ dashboards: [dash, ...s.dashboards] }))
        return dash
      },
      duplicateDashboard: (dashboardId) => {
        const orig = get().dashboards.find((d) => d.id === dashboardId)
        if (!orig) return null
        const id = genId("dash")
        const copy: WorkspaceDashboard = {
          ...orig,
          id,
          name: `Copy of ${orig.name}`,
          lifecycleStatus: "created",
          ownerUserId: getCurrentUserId(),
          contributorUserIds: [],
          sourceDashboardId: orig.id,
          thumbnailUrl: generateDashboardThumbnail(id, `Copy of ${orig.name}`, orig.widgets),
          publishedAt: null,
          deletedAt: null,
          knowledgePackVersion: orig.knowledgePackVersion ?? null,
          dashboardContext: orig.dashboardContext ? { ...orig.dashboardContext } : null,
          lastChangeAt: nowIso(),
          lastChangeByUserId: getCurrentUserId(),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }
        set((s) => ({ dashboards: [copy, ...s.dashboards] }))
        return copy
      },
      renameDashboard: (dashboardId, name) =>
        set((s) => ({
          dashboards: s.dashboards.map((d) =>
            d.id === dashboardId
              ? {
                  ...d,
                  name: name.trim() || d.name,
                  lastChangeAt: nowIso(),
                  lastChangeByUserId: getCurrentUserId(),
                  updatedAt: nowIso(),
                }
              : d
          ),
        })),
      moveDashboard: (dashboardId, folderId) =>
        set((s) => ({
          dashboards: s.dashboards.map((d) =>
            d.id === dashboardId ? { ...d, folderId, updatedAt: nowIso() } : d
          ),
        })),
      saveDashboardWidgets: (dashboardId, widgets) =>
        set((s) => ({
          dashboards: s.dashboards.map((d) => {
            if (d.id !== dashboardId) return d
            const meId = getCurrentUserId()
            const isOwner = d.ownerUserId === meId
            const contributorUserIds =
              !isOwner && !d.contributorUserIds.includes(meId)
                ? [...d.contributorUserIds, meId]
                : d.contributorUserIds
            const hasCatalog = widgets.some((w) => w.templateKey)
            const kType = getEquipmentTypeKey(d.equipmentId)
            const packVer =
              hasCatalog && kType === "coker"
                ? COKER_V1_VERSION
                : d.knowledgePackVersion ?? null
            return {
              ...d,
              widgets,
              knowledgePackVersion: packVer,
              contributorUserIds,
              thumbnailUrl: generateDashboardThumbnail(d.id, d.name, widgets),
              lastChangeAt: nowIso(),
              lastChangeByUserId: meId,
              updatedAt: nowIso(),
            }
          }),
        })),
      saveDashboardContext: (dashboardId, context) =>
        set((s) => ({
          dashboards: s.dashboards.map((d) =>
            d.id === dashboardId
              ? {
                  ...d,
                  dashboardContext: context,
                  lastChangeAt: nowIso(),
                  lastChangeByUserId: getCurrentUserId(),
                  updatedAt: nowIso(),
                }
              : d
          ),
        })),
      duplicateDashboardToEquipment: (dashboardId, targetEquipmentId) => {
        const orig = get().dashboards.find((d) => d.id === dashboardId)
        if (!orig) return null
        if (getEquipmentTypeKey(orig.equipmentId) !== getEquipmentTypeKey(targetEquipmentId)) {
          return null
        }
        const id = genId("dash")
        const newWidgets: GridWidget[] = orig.widgets.map((w) => {
          const nid = genId("w")
          return {
            ...w,
            id: nid,
            layout: { ...w.layout, i: nid },
          }
        })
        const k = getEquipmentTypeKey(targetEquipmentId)
        const copy: WorkspaceDashboard = {
          ...orig,
          id,
          equipmentId: targetEquipmentId,
          name: `${orig.name} (copy)`,
          lifecycleStatus: "created",
          ownerUserId: getCurrentUserId(),
          contributorUserIds: [],
          sourceDashboardId: orig.id,
          widgets: newWidgets,
          publishedAt: null,
          deletedAt: null,
          knowledgePackVersion:
            k === "coker" && newWidgets.some((w) => w.templateKey) ? COKER_V1_VERSION : orig.knowledgePackVersion,
          dashboardContext: orig.dashboardContext ? { ...orig.dashboardContext } : null,
          thumbnailUrl: generateDashboardThumbnail(id, `${orig.name} (copy)`, newWidgets),
          lastChangeAt: nowIso(),
          lastChangeByUserId: getCurrentUserId(),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }
        set((s) => ({ dashboards: [copy, ...s.dashboards] }))
        return copy
      },
      submitCatalogParameterRequest: ({ body, equipmentId, categoryHint }) => {
        const req: CatalogParameterRequest = {
          id: genId("cpr"),
          requesterUserId: getCurrentUserId(),
          equipmentId,
          body: body.trim() || "(empty)",
          categoryHint,
          status: "submitted",
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }
        set((s) => ({ catalogParameterRequests: [req, ...s.catalogParameterRequests] }))
        return req
      },
      updateCatalogParameterRequestStatus: (requestId, status) =>
        set((s) => ({
          catalogParameterRequests: s.catalogParameterRequests.map((r) =>
            r.id === requestId ? { ...r, status, updatedAt: nowIso() } : r
          ),
        })),
      publishDashboard: (dashboardId) =>
        set((s) => ({
          dashboards: s.dashboards.map((d) =>
            d.id === dashboardId
              ? {
                  ...d,
                  lifecycleStatus: "published",
                  publishedAt: d.publishedAt ?? nowIso(),
                  updatedAt: nowIso(),
                }
              : d
          ),
        })),
      unpublishDashboard: (dashboardId) =>
        set((s) => ({
          dashboards: s.dashboards.map((d) =>
            d.id === dashboardId
              ? {
                  ...d,
                  lifecycleStatus: "created",
                  updatedAt: nowIso(),
                  // Per resolution: shares persist on unpublish; publishedAt stays
                  // as a historical marker but Asset Module keys off lifecycleStatus.
                }
              : d
          ),
        })),
      softDeleteDashboard: (dashboardId) =>
        set((s) => ({
          dashboards: s.dashboards.map((d) =>
            d.id === dashboardId
              ? { ...d, deletedAt: nowIso(), updatedAt: nowIso() }
              : d
          ),
        })),
      restoreDashboard: (dashboardId) =>
        set((s) => ({
          dashboards: s.dashboards.map((d) =>
            d.id === dashboardId ? { ...d, deletedAt: null, updatedAt: nowIso() } : d
          ),
        })),
      permanentlyDeleteDashboard: (dashboardId) =>
        set((s) => ({
          dashboards: s.dashboards.filter((d) => d.id !== dashboardId),
          shares: s.shares.filter((sh) => sh.dashboardId !== dashboardId),
          shareLinks: s.shareLinks.filter((l) => l.dashboardId !== dashboardId),
          comments: s.comments.filter((c) => c.dashboardId !== dashboardId),
          permissionRequests: s.permissionRequests.filter(
            (r) => r.dashboardId !== dashboardId
          ),
          notifications: s.notifications.filter((n) => n.dashboardId !== dashboardId),
        })),
      recordDashboardOpened: (dashboardId) =>
        set((s) => {
          const dedup = s.recentDashboardIds.filter((id) => id !== dashboardId)
          return { recentDashboardIds: [dashboardId, ...dedup].slice(0, RECENT_LIMIT) }
        }),

      /* ── Sharing ────────────────────────────────────────────────────────── */
      shareWithUser: ({
        dashboardId,
        sharedWithUserId,
        permission,
        message,
        notifyOnFirstView,
      }) => {
        const me = getCurrentUserId()
        // Replace existing non-revoked share for this (dashboard, recipient).
        const existing = get().shares.find(
          (sh) =>
            sh.dashboardId === dashboardId &&
            sh.sharedWithUserId === sharedWithUserId &&
            sh.revokedAt === null
        )
        const share: DashboardShare = existing
          ? {
              ...existing,
              permission,
              message: message ?? existing.message,
              notifyOnFirstView: notifyOnFirstView ?? existing.notifyOnFirstView,
              updatedAt: nowIso(),
            }
          : {
              id: genId("share"),
              dashboardId,
              sharedByUserId: me,
              sharedWithUserId,
              permission,
              message: message ?? null,
              notifyOnFirstView: !!notifyOnFirstView,
              firstViewedAt: null,
              revokedAt: null,
              createdAt: nowIso(),
              updatedAt: nowIso(),
            }
        set((s) => ({
          shares: existing
            ? s.shares.map((sh) => (sh.id === existing.id ? share : sh))
            : [share, ...s.shares],
        }))

        // Generate "shared with you" notification for the recipient.
        const dash = get().dashboards.find((d) => d.id === dashboardId)
        const actor = findOrgUserById(me)
        if (dash && actor) {
          get().pushNotification({
            userId: sharedWithUserId,
            category: "dashboard_shared_with_you",
            dashboardId,
            relatedShareId: share.id,
            relatedRequestId: null,
            actorUserId: me,
            title: `${actor.name} shared '${dash.name}' with you`,
            body: `Permission: ${permission}${message ? ` · "${message}"` : ""}`,
          })
        }
        return share
      },

      updateShare: (shareId, updates) =>
        set((s) => ({
          shares: s.shares.map((sh) =>
            sh.id === shareId
              ? {
                  ...sh,
                  ...(updates.permission !== undefined ? { permission: updates.permission } : {}),
                  ...(updates.revokedAt !== undefined ? { revokedAt: updates.revokedAt } : {}),
                  updatedAt: nowIso(),
                }
              : sh
          ),
        })),

      generateShareLink: ({ dashboardId, permission }) => {
        const link: ShareLink = {
          id: genId("link"),
          dashboardId,
          createdByUserId: getCurrentUserId(),
          token: genToken(),
          permission,
          revokedAt: null,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }
        set((s) => ({ shareLinks: [link, ...s.shareLinks] }))
        return link
      },
      revokeShareLink: (linkId) =>
        set((s) => ({
          shareLinks: s.shareLinks.map((l) =>
            l.id === linkId ? { ...l, revokedAt: nowIso(), updatedAt: nowIso() } : l
          ),
        })),
      regenerateShareLink: (linkId) => {
        const orig = get().shareLinks.find((l) => l.id === linkId)
        if (!orig) return null
        const fresh: ShareLink = {
          ...orig,
          token: genToken(),
          revokedAt: null,
          updatedAt: nowIso(),
        }
        set((s) => ({
          shareLinks: s.shareLinks.map((l) => (l.id === linkId ? fresh : l)),
        }))
        return fresh
      },

      markShareFirstViewed: (shareId) => {
        const share = get().shares.find((sh) => sh.id === shareId)
        if (!share || share.firstViewedAt) return false
        const updated: DashboardShare = {
          ...share,
          firstViewedAt: nowIso(),
          updatedAt: nowIso(),
        }
        set((s) => ({
          shares: s.shares.map((sh) => (sh.id === shareId ? updated : sh)),
        }))
        if (share.notifyOnFirstView) {
          const dash = get().dashboards.find((d) => d.id === share.dashboardId)
          const actor = findOrgUserById(share.sharedWithUserId)
          if (dash && actor) {
            get().pushNotification({
              userId: share.sharedByUserId,
              category: "dashboard_first_view",
              dashboardId: dash.id,
              relatedShareId: share.id,
              relatedRequestId: null,
              actorUserId: share.sharedWithUserId,
              title: `${actor.name} viewed '${dash.name}' for the first time`,
              body: null,
            })
          }
          return true
        }
        return false
      },

      /* ── Comments ──────────────────────────────────────────────────────── */
      addComment: ({ dashboardId, body }) => {
        const trimmed = body.trim()
        if (!trimmed) return null
        const cmt: DashboardComment = {
          id: genId("cmt"),
          dashboardId,
          authorUserId: getCurrentUserId(),
          body: trimmed.slice(0, 2000),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }
        set((s) => ({ comments: [...s.comments, cmt] }))
        return cmt
      },

      /* ── Permission requests ───────────────────────────────────────────── */
      requestPermission: ({ dashboardId, requestedPermission, message }) => {
        const me = getCurrentUserId()
        const dash = get().dashboards.find((d) => d.id === dashboardId)
        if (!dash) return null
        const req: PermissionRequest = {
          id: genId("req"),
          dashboardId,
          requestedByUserId: me,
          requestedToUserId: dash.ownerUserId,
          requestedPermission,
          status: "pending",
          resolvedAt: null,
          message: message?.trim() || null,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }
        set((s) => ({ permissionRequests: [req, ...s.permissionRequests] }))

        const actor = findOrgUserById(me)
        if (actor) {
          get().pushNotification({
            userId: dash.ownerUserId,
            category: "permission_request_received",
            dashboardId: dash.id,
            relatedShareId: null,
            relatedRequestId: req.id,
            actorUserId: me,
            title: `${actor.name} requested ${requestedPermission} access on '${dash.name}'`,
            body: req.message,
          })
        }
        return req
      },
      resolvePermissionRequest: (requestId, status) => {
        const req = get().permissionRequests.find((r) => r.id === requestId)
        if (!req || req.status !== "pending") return
        const resolvedAt = nowIso()
        set((s) => ({
          permissionRequests: s.permissionRequests.map((r) =>
            r.id === requestId ? { ...r, status, resolvedAt, updatedAt: resolvedAt } : r
          ),
        }))

        // If granted, upgrade or create the corresponding share.
        if (status === "granted") {
          get().shareWithUser({
            dashboardId: req.dashboardId,
            sharedWithUserId: req.requestedByUserId,
            permission: req.requestedPermission,
          })
        }

        // Notify the requester of the resolution.
        const dash = get().dashboards.find((d) => d.id === req.dashboardId)
        const me = getCurrentUserId()
        const actor = findOrgUserById(me)
        if (dash && actor) {
          get().pushNotification({
            userId: req.requestedByUserId,
            category: "permission_request_resolved",
            dashboardId: dash.id,
            relatedShareId: null,
            relatedRequestId: req.id,
            actorUserId: me,
            title: `${actor.name} ${status} your ${req.requestedPermission} access request on '${dash.name}'`,
            body: null,
          })
        }
      },

      /* ── Notifications ─────────────────────────────────────────────────── */
      pushNotification: (notif) => {
        const n: Notification = {
          ...notif,
          id: genId("notif"),
          readAt: notif.readAt ?? null,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }
        set((s) => ({ notifications: [n, ...s.notifications] }))
        return n
      },
      markNotificationRead: (notificationId) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === notificationId && !n.readAt
              ? { ...n, readAt: nowIso(), updatedAt: nowIso() }
              : n
          ),
        })),
      markAllNotificationsRead: () => {
        const me = getCurrentUserId()
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.userId === me && !n.readAt
              ? { ...n, readAt: nowIso(), updatedAt: nowIso() }
              : n
          ),
        }))
      },

      /* ── Filters / sort / search ───────────────────────────────────────── */
      setSearchQuery: (q) => set({ searchQuery: q }),
      setFilter: (key, value) =>
        set((s) => ({ filters: { ...s.filters, [key]: value } })),
      clearFilters: () => set({ filters: { ...EMPTY_FILTERS } }),
      setSort: (key, dir) => set({ sortKey: key, sortDir: dir }),
      setInitialEquipmentFilter: (id) => set({ initialEquipmentFilter: id }),
    }),
    {
      name: "spm-one:workspace-store-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Persist data + UI state. Filters/search/sort are intentionally persisted
      // so the user resumes mid-session; identity is keyed off identity.ts.
      partialize: (s) => ({
        folders: s.folders,
        dashboards: s.dashboards,
        shares: s.shares,
        shareLinks: s.shareLinks,
        comments: s.comments,
        permissionRequests: s.permissionRequests,
        notifications: s.notifications,
        catalogParameterRequests: s.catalogParameterRequests,
        recentDashboardIds: s.recentDashboardIds,
        searchQuery: s.searchQuery,
        filters: s.filters,
        sortKey: s.sortKey,
        sortDir: s.sortDir,
        // initialEquipmentFilter is transient
      }),
    }
  )
)

/* ─── Selectors used widely (kept here to avoid deep selectors per component) */

export function selectActiveDashboards(s: WorkspaceState): WorkspaceDashboard[] {
  return s.dashboards.filter((d) => !d.deletedAt)
}

/** Dashboards owned by the current user (active only). */
export function selectMyDashboards(s: WorkspaceState): WorkspaceDashboard[] {
  const me = getCurrentUserId()
  return selectActiveDashboards(s).filter((d) => d.ownerUserId === me)
}

/** Dashboards shared with the current user via active (non-revoked) shares. */
export function selectSharedWithMeDashboards(
  s: WorkspaceState
): Array<{ dashboard: WorkspaceDashboard; share: DashboardShare }> {
  const me = getCurrentUserId()
  const out: Array<{ dashboard: WorkspaceDashboard; share: DashboardShare }> = []
  for (const sh of s.shares) {
    if (sh.sharedWithUserId !== me) continue
    if (sh.revokedAt) continue
    const dash = s.dashboards.find((d) => d.id === sh.dashboardId && !d.deletedAt)
    if (!dash) continue
    out.push({ dashboard: dash, share: sh })
  }
  return out
}

export function selectMyFolders(s: WorkspaceState): WorkspaceFolder[] {
  const me = getCurrentUserId()
  return s.folders.filter((f) => f.ownerUserId === me)
}

export function selectMyNotifications(s: WorkspaceState): Notification[] {
  const me = getCurrentUserId()
  return s.notifications
    .filter((n) => n.userId === me)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export function selectMyUnreadCount(s: WorkspaceState): number {
  const me = getCurrentUserId()
  return s.notifications.reduce((n, x) => (x.userId === me && !x.readAt ? n + 1 : n), 0)
}

/**
 * Effective permission of the current user on a dashboard.
 * - Owner ⇒ "edit" (always).
 * - Active (non-revoked) DashboardShare matching me ⇒ that permission.
 * - Otherwise null (no access — but still visible if the dashboard is
 *   published in the Asset Module, handled separately).
 */
export function selectMyPermissionOn(
  s: WorkspaceState,
  dashboardId: string
): SharePermission | null {
  const me = getCurrentUserId()
  const dash = s.dashboards.find((d) => d.id === dashboardId)
  if (!dash) return null
  if (dash.ownerUserId === me) return "edit"
  const share = s.shares.find(
    (sh) =>
      sh.dashboardId === dashboardId &&
      sh.sharedWithUserId === me &&
      !sh.revokedAt
  )
  return share?.permission ?? null
}

/** Trash purge — soft-deleted past TTL becomes permanently deleted on read. */
export function selectTrashDashboards(s: WorkspaceState): WorkspaceDashboard[] {
  const me = getCurrentUserId()
  const cutoff = Date.now() - TRASH_TTL_DAYS * 24 * 3_600_000
  return s.dashboards.filter(
    (d) =>
      d.ownerUserId === me &&
      d.deletedAt !== null &&
      new Date(d.deletedAt).getTime() >= cutoff
  )
}

export const NOTIFICATION_LABEL: Record<NotificationCategory, string> = {
  dashboard_shared_with_you: "Shared with you",
  dashboard_first_view: "First view",
  permission_request_received: "Access request",
  permission_request_resolved: "Request resolved",
  edit_lock_blocked: "Editor in use",
}

/** Utility: known org user ids — exported for consumers that need the directory. */
export const ALL_ORG_USER_IDS = ORG_USERS.map((u) => u.id)
