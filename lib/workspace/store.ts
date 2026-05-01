/**
 * Workspace Module Zustand store.
 *
 * Holds folders, dashboards, shares, links, comments, permission requests,
 * notifications, and Workspace UI state (filters/sort/search/recent/selection).
 * Persisted to localStorage for UI preferences and mock-only slices; core
 * workspace collections hydrate from GET /api/workspace/bootstrap when signed in
 * (Tasks 6–7) and are not the persisted source of truth.
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
import { workspaceApiPaths } from "./api-paths"
import { getWorkspaceRemoteMode } from "./remote-mode"
import {
  fetchWorkspaceBootstrap,
  parseJsonOk,
  workspaceFetch,
  type WorkspaceBootstrapPayload,
} from "./workspace-fetch"

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
  /**
   * Incremented when session identity syncs so selectors that call `getCurrentUserId()`
   * refresh for subscribed Zustand consumers.
   */
  workspaceIdentityRevision: number

  /* ── Actions: data lifecycle ────────────────────────────────────────────── */
  resetWorkspace: () => void
  /** Replace server-backed workspace collections from GET /api/workspace/bootstrap. */
  hydrateWorkspaceFromServer: (payload: WorkspaceBootstrapPayload) => void

  /* ── Actions: folders ──────────────────────────────────────────────────── */
  createFolder: (input: { name: string; parentFolderId: string | null }) => Promise<WorkspaceFolder>
  renameFolder: (folderId: string, name: string) => Promise<void>
  moveFolder: (folderId: string, parentFolderId: string | null) => Promise<void>
  deleteFolder: (folderId: string, mode: "move-to-root" | "cascade") => Promise<void>

  /* ── Actions: dashboards ────────────────────────────────────────────────── */
  createDashboard: (input: {
    name: string
    equipmentId: string
    folderId: string | null
    widgets?: GridWidget[]
  }) => Promise<WorkspaceDashboard>
  duplicateDashboard: (dashboardId: string) => Promise<WorkspaceDashboard | null>
  renameDashboard: (dashboardId: string, name: string) => Promise<void>
  moveDashboard: (dashboardId: string, folderId: string | null) => Promise<void>
  saveDashboardWidgets: (dashboardId: string, widgets: GridWidget[]) => Promise<void>
  saveDashboardContext: (dashboardId: string, context: DashboardContextState | null) => Promise<void>
  duplicateDashboardToEquipment: (
    dashboardId: string,
    targetEquipmentId: string
  ) => Promise<WorkspaceDashboard | null>
  submitCatalogParameterRequest: (input: {
    body: string
    equipmentId: string | null
    categoryHint: string | null
  }) => CatalogParameterRequest
  updateCatalogParameterRequestStatus: (
    requestId: string,
    status: CatalogParameterRequest["status"]
  ) => void
  publishDashboard: (dashboardId: string) => Promise<void>
  unpublishDashboard: (dashboardId: string) => Promise<void>
  softDeleteDashboard: (dashboardId: string) => Promise<void>
  restoreDashboard: (dashboardId: string) => Promise<void>
  permanentlyDeleteDashboard: (dashboardId: string) => Promise<void>
  recordDashboardOpened: (dashboardId: string) => void

  /* ── Actions: sharing ───────────────────────────────────────────────────── */
  shareWithUser: (input: {
    dashboardId: string
    sharedWithUserId: string
    permission: SharePermission
    message?: string
    notifyOnFirstView?: boolean
  }) => Promise<DashboardShare>
  updateShare: (
    shareId: string,
    updates: { permission?: SharePermission; revokedAt?: string | null }
  ) => Promise<void>
  generateShareLink: (input: {
    dashboardId: string
    permission: SharePermission
  }) => Promise<ShareLink>
  revokeShareLink: (linkId: string) => Promise<void>
  regenerateShareLink: (linkId: string) => Promise<ShareLink | null>
  /** Marks first view; returns true if owner should be notified (mock path only). */
  markShareFirstViewed: (shareId: string) => Promise<boolean>
  /** Redeem a share link token for the signed-in user (remote API only). */
  acceptShareFromLink: (token: string) => Promise<DashboardShare>

  /* ── Actions: comments ──────────────────────────────────────────────────── */
  addComment: (input: { dashboardId: string; body: string }) => Promise<DashboardComment | null>

  /* ── Actions: permission requests ───────────────────────────────────────── */
  requestPermission: (input: {
    dashboardId: string
    requestedPermission: "comment" | "edit"
    message?: string
  }) => Promise<PermissionRequest | null>
  resolvePermissionRequest: (
    requestId: string,
    status: Exclude<PermissionRequestStatus, "pending">
  ) => Promise<void>

  /* ── Actions: notifications ─────────────────────────────────────────────── */
  pushNotification: (
    notif: Omit<Notification, "id" | "createdAt" | "updatedAt" | "readAt"> & {
      readAt?: string | null
    }
  ) => Notification
  markNotificationRead: (notificationId: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>

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
  | "hydrateWorkspaceFromServer"
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
  | "acceptShareFromLink"
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
  workspaceIdentityRevision: 0,
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
          workspaceIdentityRevision: 0,
        }),

      hydrateWorkspaceFromServer: (payload) =>
        set({
          folders: payload.folders,
          dashboards: payload.dashboards,
          shares: payload.shares,
          shareLinks: payload.shareLinks,
          comments: payload.comments,
          permissionRequests: payload.permissionRequests,
          notifications: payload.notifications,
        }),

      /* ── Folders ────────────────────────────────────────────────────────── */
      createFolder: async ({ name, parentFolderId }) => {
        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.folders, {
            method: "POST",
            body: JSON.stringify({
              name: name.trim() || "Untitled folder",
              parentFolderId,
            }),
          })
          const folder = await parseJsonOk<WorkspaceFolder>(res)
          set((s) => ({ folders: [...s.folders, folder] }))
          return folder
        }
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
      renameFolder: async (folderId, name) => {
        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.folder(folderId), {
            method: "PATCH",
            body: JSON.stringify({ name: name.trim() || "Untitled folder" }),
          })
          const folder = await parseJsonOk<WorkspaceFolder>(res)
          set((s) => ({
            folders: s.folders.map((f) => (f.id === folderId ? folder : f)),
          }))
          return
        }
        set((s) => ({
          folders: s.folders.map((f) =>
            f.id === folderId ? { ...f, name: name.trim() || f.name, updatedAt: nowIso() } : f
          ),
        }))
      },
      moveFolder: async (folderId, parentFolderId) => {
        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.folder(folderId), {
            method: "PATCH",
            body: JSON.stringify({ parentFolderId }),
          })
          const folder = await parseJsonOk<WorkspaceFolder>(res)
          set((s) => ({
            folders: s.folders.map((f) => (f.id === folderId ? folder : f)),
          }))
          return
        }
        set((s) => ({
          folders: s.folders.map((f) =>
            f.id === folderId ? { ...f, parentFolderId, updatedAt: nowIso() } : f
          ),
        }))
      },
      deleteFolder: async (folderId, mode) => {
        if (getWorkspaceRemoteMode()) {
          const q = mode === "cascade" ? "?mode=cascade" : ""
          const res = await workspaceFetch(`${workspaceApiPaths.folder(folderId)}${q}`, {
            method: "DELETE",
          })
          await parseJsonOk<{ deletedFolderIds: string[] }>(res)
          const data = await fetchWorkspaceBootstrap()
          set({
            folders: data.folders,
            dashboards: data.dashboards,
            shares: data.shares,
            shareLinks: data.shareLinks,
            comments: data.comments,
            permissionRequests: data.permissionRequests,
            notifications: data.notifications,
          })
          return
        }
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
        })
      },

      /* ── Dashboards ────────────────────────────────────────────────────── */
      createDashboard: async ({ name, equipmentId, folderId, widgets }) => {
        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.dashboards, {
            method: "POST",
            body: JSON.stringify({
              name: name.trim() || "Untitled dashboard",
              equipmentId,
              folderId,
              widgets: widgets ?? [],
            }),
          })
          const dash = await parseJsonOk<WorkspaceDashboard>(res)
          set((s) => ({ dashboards: [dash, ...s.dashboards] }))
          return dash
        }
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
      duplicateDashboard: async (dashboardId) => {
        const orig = get().dashboards.find((d) => d.id === dashboardId)
        if (!orig) return null
        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.dashboards, {
            method: "POST",
            body: JSON.stringify({
              name: `Copy of ${orig.name}`,
              equipmentId: orig.equipmentId,
              folderId: orig.folderId,
              widgets: orig.widgets,
            }),
          })
          const copy = await parseJsonOk<WorkspaceDashboard>(res)
          set((s) => ({ dashboards: [copy, ...s.dashboards] }))
          return copy
        }
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
      renameDashboard: async (dashboardId, name) => {
        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.dashboard(dashboardId), {
            method: "PATCH",
            body: JSON.stringify({ name: name.trim() || "Untitled dashboard" }),
          })
          const dash = await parseJsonOk<WorkspaceDashboard>(res)
          set((s) => ({
            dashboards: s.dashboards.map((d) => (d.id === dashboardId ? dash : d)),
          }))
          return
        }
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
        }))
      },
      moveDashboard: async (dashboardId, folderId) => {
        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.dashboard(dashboardId), {
            method: "PATCH",
            body: JSON.stringify({ folderId }),
          })
          const dash = await parseJsonOk<WorkspaceDashboard>(res)
          set((s) => ({
            dashboards: s.dashboards.map((d) => (d.id === dashboardId ? dash : d)),
          }))
          return
        }
        set((s) => ({
          dashboards: s.dashboards.map((d) =>
            d.id === dashboardId ? { ...d, folderId, updatedAt: nowIso() } : d
          ),
        }))
      },
      saveDashboardWidgets: async (dashboardId, widgets) => {
        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.dashboard(dashboardId), {
            method: "PATCH",
            body: JSON.stringify({ widgets }),
          })
          const dash = await parseJsonOk<WorkspaceDashboard>(res)
          set((s) => ({
            dashboards: s.dashboards.map((d) => (d.id === dashboardId ? dash : d)),
          }))
          return
        }
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
        }))
      },
      saveDashboardContext: async (dashboardId, context) => {
        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.dashboard(dashboardId), {
            method: "PATCH",
            body: JSON.stringify({
              dashboardContext:
                context === null ? null : (context as unknown as Record<string, unknown>),
            }),
          })
          const dash = await parseJsonOk<WorkspaceDashboard>(res)
          set((s) => ({
            dashboards: s.dashboards.map((d) => (d.id === dashboardId ? dash : d)),
          }))
          return
        }
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
        }))
      },
      duplicateDashboardToEquipment: async (dashboardId, targetEquipmentId) => {
        const orig = get().dashboards.find((d) => d.id === dashboardId)
        if (!orig) return null
        if (getEquipmentTypeKey(orig.equipmentId) !== getEquipmentTypeKey(targetEquipmentId)) {
          return null
        }
        const newWidgets: GridWidget[] = orig.widgets.map((w) => {
          const nid = genId("w")
          return {
            ...w,
            id: nid,
            layout: { ...w.layout, i: nid },
          }
        })
        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.dashboards, {
            method: "POST",
            body: JSON.stringify({
              name: `${orig.name} (copy)`,
              equipmentId: targetEquipmentId,
              folderId: orig.folderId,
              widgets: newWidgets,
            }),
          })
          const copy = await parseJsonOk<WorkspaceDashboard>(res)
          set((s) => ({ dashboards: [copy, ...s.dashboards] }))
          return copy
        }
        const id = genId("dash")
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
      publishDashboard: async (dashboardId) => {
        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.dashboard(dashboardId), {
            method: "PATCH",
            body: JSON.stringify({ lifecycleStatus: "published" }),
          })
          const dash = await parseJsonOk<WorkspaceDashboard>(res)
          set((s) => ({
            dashboards: s.dashboards.map((d) => (d.id === dashboardId ? dash : d)),
          }))
          return
        }
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
        }))
      },
      unpublishDashboard: async (dashboardId) => {
        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.dashboard(dashboardId), {
            method: "PATCH",
            body: JSON.stringify({ lifecycleStatus: "created" }),
          })
          const dash = await parseJsonOk<WorkspaceDashboard>(res)
          set((s) => ({
            dashboards: s.dashboards.map((d) => (d.id === dashboardId ? dash : d)),
          }))
          return
        }
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
        }))
      },
      softDeleteDashboard: async (dashboardId) => {
        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.dashboard(dashboardId), {
            method: "DELETE",
          })
          const dash = await parseJsonOk<WorkspaceDashboard>(res)
          set((s) => ({
            dashboards: s.dashboards.map((d) => (d.id === dashboardId ? dash : d)),
          }))
          return
        }
        set((s) => ({
          dashboards: s.dashboards.map((d) =>
            d.id === dashboardId
              ? { ...d, deletedAt: nowIso(), updatedAt: nowIso() }
              : d
          ),
        }))
      },
      restoreDashboard: async (dashboardId) => {
        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.dashboardRestore(dashboardId), {
            method: "POST",
          })
          const dash = await parseJsonOk<WorkspaceDashboard>(res)
          set((s) => ({
            dashboards: s.dashboards.map((d) => (d.id === dashboardId ? dash : d)),
          }))
          return
        }
        set((s) => ({
          dashboards: s.dashboards.map((d) =>
            d.id === dashboardId ? { ...d, deletedAt: null, updatedAt: nowIso() } : d
          ),
        }))
      },
      permanentlyDeleteDashboard: async (dashboardId) => {
        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(
            `${workspaceApiPaths.dashboard(dashboardId)}?permanent=1`,
            { method: "DELETE" }
          )
          await parseJsonOk<{ deleted: true }>(res)
          set((s) => ({
            dashboards: s.dashboards.filter((d) => d.id !== dashboardId),
            shares: s.shares.filter((sh) => sh.dashboardId !== dashboardId),
            shareLinks: s.shareLinks.filter((l) => l.dashboardId !== dashboardId),
            comments: s.comments.filter((c) => c.dashboardId !== dashboardId),
            permissionRequests: s.permissionRequests.filter(
              (r) => r.dashboardId !== dashboardId
            ),
            notifications: s.notifications.filter((n) => n.dashboardId !== dashboardId),
          }))
          return
        }
        set((s) => ({
          dashboards: s.dashboards.filter((d) => d.id !== dashboardId),
          shares: s.shares.filter((sh) => sh.dashboardId !== dashboardId),
          shareLinks: s.shareLinks.filter((l) => l.dashboardId !== dashboardId),
          comments: s.comments.filter((c) => c.dashboardId !== dashboardId),
          permissionRequests: s.permissionRequests.filter(
            (r) => r.dashboardId !== dashboardId
          ),
          notifications: s.notifications.filter((n) => n.dashboardId !== dashboardId),
        }))
      },
      recordDashboardOpened: (dashboardId) =>
        set((s) => {
          const dedup = s.recentDashboardIds.filter((id) => id !== dashboardId)
          return { recentDashboardIds: [dashboardId, ...dedup].slice(0, RECENT_LIMIT) }
        }),

      /* ── Sharing ────────────────────────────────────────────────────────── */
      shareWithUser: async ({
        dashboardId,
        sharedWithUserId,
        permission,
        message,
        notifyOnFirstView,
      }) => {
        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.shares, {
            method: "POST",
            body: JSON.stringify({
              dashboardId,
              sharedWithUserId,
              permission,
              message: message ?? null,
              notifyOnFirstView,
            }),
          })
          const share = await parseJsonOk<DashboardShare>(res)
          set((s) => ({
            shares: s.shares.some((sh) => sh.id === share.id)
              ? s.shares.map((sh) => (sh.id === share.id ? share : sh))
              : [share, ...s.shares],
          }))
          return share
        }

        const me = getCurrentUserId()
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

      updateShare: async (shareId, updates) => {
        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.share(shareId), {
            method: "PATCH",
            body: JSON.stringify({
              ...(updates.permission !== undefined ? { permission: updates.permission } : {}),
              ...(updates.revokedAt !== undefined ? { revokedAt: updates.revokedAt } : {}),
            }),
          })
          const share = await parseJsonOk<DashboardShare>(res)
          set((s) => ({
            shares: s.shares.map((sh) => (sh.id === shareId ? share : sh)),
          }))
          return
        }
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
        }))
      },

      generateShareLink: async ({ dashboardId, permission }) => {
        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.shareLinks, {
            method: "POST",
            body: JSON.stringify({ dashboardId, permission }),
          })
          const link = await parseJsonOk<ShareLink>(res)
          set((s) => ({ shareLinks: [link, ...s.shareLinks] }))
          return link
        }
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
      revokeShareLink: async (linkId) => {
        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.shareLink(linkId), {
            method: "PATCH",
            body: JSON.stringify({}),
          })
          const link = await parseJsonOk<ShareLink>(res)
          set((s) => ({
            shareLinks: s.shareLinks.map((l) => (l.id === linkId ? link : l)),
          }))
          return
        }
        set((s) => ({
          shareLinks: s.shareLinks.map((l) =>
            l.id === linkId ? { ...l, revokedAt: nowIso(), updatedAt: nowIso() } : l
          ),
        }))
      },
      regenerateShareLink: async (linkId) => {
        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.shareLinkRegenerate(linkId), {
            method: "POST",
          })
          const link = await parseJsonOk<ShareLink>(res)
          set((s) => ({
            shareLinks: s.shareLinks.map((l) => (l.id === linkId ? link : l)),
          }))
          return link
        }
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

      markShareFirstViewed: async (shareId) => {
        const share = get().shares.find((sh) => sh.id === shareId)
        if (!share || share.firstViewedAt) return false

        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.shareFirstView(shareId), {
            method: "POST",
          })
          const updated = await parseJsonOk<DashboardShare>(res)
          set((s) => ({
            shares: s.shares.map((sh) => (sh.id === shareId ? updated : sh)),
          }))
          return !!(share.notifyOnFirstView && share.firstViewedAt === null && updated.firstViewedAt)
        }

        const next: DashboardShare = {
          ...share,
          firstViewedAt: nowIso(),
          updatedAt: nowIso(),
        }
        set((s) => ({
          shares: s.shares.map((sh) => (sh.id === shareId ? next : sh)),
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

      acceptShareFromLink: async (token) => {
        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.shareLinkAccept, {
            method: "POST",
            body: JSON.stringify({ token }),
          })
          const share = await parseJsonOk<DashboardShare>(res)
          set((s) => ({
            shares: s.shares.some((x) => x.id === share.id)
              ? s.shares.map((x) => (x.id === share.id ? share : x))
              : [share, ...s.shares],
          }))
          return share
        }
        throw new Error("acceptShareFromLink requires remote workspace mode")
      },

      /* ── Comments ──────────────────────────────────────────────────────── */
      addComment: async ({ dashboardId, body }) => {
        const trimmed = body.trim()
        if (!trimmed) return null
        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.dashboardComments(dashboardId), {
            method: "POST",
            body: JSON.stringify({ body: trimmed }),
          })
          const cmt = await parseJsonOk<DashboardComment>(res)
          set((s) => ({ comments: [cmt, ...s.comments] }))
          return cmt
        }
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
      requestPermission: async ({ dashboardId, requestedPermission, message }) => {
        const me = getCurrentUserId()
        const dash = get().dashboards.find((d) => d.id === dashboardId)
        if (!dash) return null

        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.permissionRequests, {
            method: "POST",
            body: JSON.stringify({
              dashboardId,
              requestedPermission,
              message: message?.trim() || null,
            }),
          })
          const req = await parseJsonOk<PermissionRequest>(res)
          set((s) => ({ permissionRequests: [req, ...s.permissionRequests] }))
          return req
        }

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
      resolvePermissionRequest: async (requestId, status) => {
        const req = get().permissionRequests.find((r) => r.id === requestId)
        if (!req || req.status !== "pending") return

        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.permissionRequest(requestId), {
            method: "PATCH",
            body: JSON.stringify({ status }),
          })
          await parseJsonOk<PermissionRequest>(res)
          await refreshWorkspaceFromServer()
          return
        }

        const resolvedAt = nowIso()
        set((s) => ({
          permissionRequests: s.permissionRequests.map((r) =>
            r.id === requestId ? { ...r, status, resolvedAt, updatedAt: resolvedAt } : r
          ),
        }))

        if (status === "granted") {
          await get().shareWithUser({
            dashboardId: req.dashboardId,
            sharedWithUserId: req.requestedByUserId,
            permission: req.requestedPermission,
          })
        }

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
      markNotificationRead: async (notificationId) => {
        if (getWorkspaceRemoteMode()) {
          const res = await workspaceFetch(workspaceApiPaths.notification(notificationId), {
            method: "PATCH",
          })
          const updated = await parseJsonOk<Notification>(res)
          set((s) => ({
            notifications: s.notifications.map((n) =>
              n.id === notificationId ? updated : n
            ),
          }))
          return
        }
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === notificationId && !n.readAt
              ? { ...n, readAt: nowIso(), updatedAt: nowIso() }
              : n
          ),
        }))
      },
      markAllNotificationsRead: async () => {
        if (getWorkspaceRemoteMode()) {
          await workspaceFetch(workspaceApiPaths.notificationsReadAll, { method: "POST" })
          await refreshWorkspaceFromServer()
          return
        }
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
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted, fromVersion) => {
        if (!persisted || typeof persisted !== "object") return persisted
        const next = { ...(persisted as Record<string, unknown>) }
        if (fromVersion < 2) {
          delete next.folders
          delete next.dashboards
          delete next.shares
        }
        if (fromVersion < 3) {
          delete next.shareLinks
          delete next.comments
          delete next.permissionRequests
          delete next.notifications
        }
        return next as typeof persisted
      },
      // Server-backed collections hydrate from GET /api/workspace/bootstrap; keep UI prefs local only.
      partialize: (s) => ({
        catalogParameterRequests: s.catalogParameterRequests,
        recentDashboardIds: s.recentDashboardIds,
        searchQuery: s.searchQuery,
        filters: s.filters,
        sortKey: s.sortKey,
        sortDir: s.sortDir,
      }),
    }
  )
)

/** Bump after Auth.js session ↔ workspace identity sync so selectors recompute. */
export function bumpWorkspaceIdentityRevision(): void {
  useWorkspaceStore.setState((s) => ({
    workspaceIdentityRevision: s.workspaceIdentityRevision + 1,
  }))
}

/** Refetch workspace collections from `GET /api/workspace/bootstrap`. */
export async function refreshWorkspaceFromServer(): Promise<void> {
  const data = await fetchWorkspaceBootstrap()
  useWorkspaceStore.getState().hydrateWorkspaceFromServer(data)
}

/* ─── Selectors used widely (kept here to avoid deep selectors per component) */

export function selectActiveDashboards(s: WorkspaceState): WorkspaceDashboard[] {
  return s.dashboards.filter((d) => !d.deletedAt)
}

/** Dashboards owned by the current user (active only). */
export function selectMyDashboards(s: WorkspaceState): WorkspaceDashboard[] {
  void s.workspaceIdentityRevision
  const me = getCurrentUserId()
  return selectActiveDashboards(s).filter((d) => d.ownerUserId === me)
}

/** Dashboards shared with the current user via active (non-revoked) shares. */
export function selectSharedWithMeDashboards(
  s: WorkspaceState
): Array<{ dashboard: WorkspaceDashboard; share: DashboardShare }> {
  void s.workspaceIdentityRevision
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
  void s.workspaceIdentityRevision
  const me = getCurrentUserId()
  return s.folders.filter((f) => f.ownerUserId === me)
}

export function selectMyNotifications(s: WorkspaceState): Notification[] {
  void s.workspaceIdentityRevision
  const me = getCurrentUserId()
  return s.notifications
    .filter((n) => n.userId === me)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export function selectMyUnreadCount(s: WorkspaceState): number {
  void s.workspaceIdentityRevision
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
  void s.workspaceIdentityRevision
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
  void s.workspaceIdentityRevision
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
