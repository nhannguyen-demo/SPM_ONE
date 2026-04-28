/**
 * Deterministic Workspace seed data.
 *
 * Produces folders, draft & published dashboards across the existing mock
 * equipment, sample shares (incoming + outgoing), sample comments, and a
 * handful of notifications so the Workspace + Comms UIs render with a
 * realistic dataset on first load.
 *
 * All ids are deterministic strings so reseeding is stable across reloads.
 */

import { sites } from "@/lib/data"
import { DEFAULT_GRIDS } from "@/components/views/equipment-dashboard/layouts"
import type {
  DashboardComment,
  DashboardShare,
  Notification,
  PermissionRequest,
  ShareLink,
  WorkspaceDashboard,
  WorkspaceFolder,
} from "./types"
import { generateDashboardThumbnail } from "./thumbnail"

const NOW = "2026-04-27T08:00:00.000Z"
const D = (offsetHours: number): string =>
  new Date(new Date(NOW).getTime() - offsetHours * 3_600_000).toISOString()

interface SeedResult {
  folders: WorkspaceFolder[]
  dashboards: WorkspaceDashboard[]
  shares: DashboardShare[]
  shareLinks: ShareLink[]
  comments: DashboardComment[]
  permissionRequests: PermissionRequest[]
  notifications: Notification[]
}

/* ─── Equipment lookup ─────────────────────────────────────────────────────── */

const ALL_EQUIPMENT = sites
  .flatMap((s) => s.units.flatMap((p) => p.equipment))
  .filter((e) => e !== undefined)

function eqByName(name: string): string | undefined {
  return ALL_EQUIPMENT.find((e) => e.name === name)?.id
}

/* ─── Folder + dashboard skeletons ─────────────────────────────────────────── */

interface DashSkel {
  /** Dashboard local id within the seed (not the final id). */
  key: string
  name: string
  equipmentId: string
  /** Fallback widget set name from DEFAULT_GRIDS. */
  widgetsKey: string
  ownerUserId: string
  contributorUserIds?: string[]
  status: "created" | "published"
  folder: string | null // folder seed key
  daysAgoChanged: number
}

interface FolderSkel {
  key: string
  ownerUserId: string
  parentKey: string | null
  name: string
}

/* ─── Seed builder ─────────────────────────────────────────────────────────── */

export function buildWorkspaceSeed(): SeedResult {
  const folders: WorkspaceFolder[] = []
  const dashboards: WorkspaceDashboard[] = []
  const shares: DashboardShare[] = []
  const shareLinks: ShareLink[] = []
  const comments: DashboardComment[] = []
  const permissionRequests: PermissionRequest[] = []
  const notifications: Notification[] = []

  const folderSkels: FolderSkel[] = [
    { key: "f-nhan-coker", ownerUserId: "user-nhan", parentKey: null, name: "Coker Operations" },
    { key: "f-nhan-coker-fatigue", ownerUserId: "user-nhan", parentKey: "f-nhan-coker", name: "Fatigue Studies" },
    { key: "f-nhan-smr", ownerUserId: "user-nhan", parentKey: null, name: "SMR Pigtail" },
    { key: "f-nhan-archive", ownerUserId: "user-nhan", parentKey: null, name: "Archive" },
    { key: "f-ben-hcu", ownerUserId: "user-ben", parentKey: null, name: "HCU 01 Reactor Health" },
    { key: "f-alex-shared-smr", ownerUserId: "user-alex", parentKey: null, name: "SMR Investigations" },
  ]
  for (const fs of folderSkels) {
    folders.push({
      id: `folder-${fs.key}`,
      ownerUserId: fs.ownerUserId,
      parentFolderId: fs.parentKey ? `folder-${fs.parentKey}` : null,
      name: fs.name,
      createdAt: D(24 * 30),
      updatedAt: D(24 * 30),
    })
  }

  const cokerId = eqByName("Coker 01")!
  const hcuId = eqByName("HCU 01")!
  const smrId = eqByName("SMR Pigtails")!

  const dashSkels: DashSkel[] = [
    // ── Nhan (current user) — owner of several drafts + published dashboards ──
    {
      key: "nhan-coker-mon",
      name: "Coker 01 — Live Monitoring",
      equipmentId: cokerId,
      widgetsKey: "Monitoring",
      ownerUserId: "user-nhan",
      contributorUserIds: ["user-ben"],
      status: "published",
      folder: "f-nhan-coker",
      daysAgoChanged: 1,
    },
    {
      key: "nhan-coker-fat",
      name: "Coker 01 — Fatigue Trend Q2",
      equipmentId: cokerId,
      widgetsKey: "Fatigue",
      ownerUserId: "user-nhan",
      status: "created",
      folder: "f-nhan-coker-fatigue",
      daysAgoChanged: 0.2,
    },
    {
      key: "nhan-coker-bul",
      name: "Coker 01 — Bulging Survey",
      equipmentId: cokerId,
      widgetsKey: "Bulging",
      ownerUserId: "user-nhan",
      contributorUserIds: ["user-simon"],
      status: "created",
      folder: "f-nhan-coker",
      daysAgoChanged: 3,
    },
    {
      key: "nhan-coker-cra",
      name: "Coker 01 — Crack Watchlist",
      equipmentId: cokerId,
      widgetsKey: "Cracking",
      ownerUserId: "user-nhan",
      status: "published",
      folder: "f-nhan-coker",
      daysAgoChanged: 6,
    },
    {
      key: "nhan-smr-pig",
      name: "SMR Pigtail Integrity",
      equipmentId: smrId,
      widgetsKey: "SMR Pigtail Integrity",
      ownerUserId: "user-nhan",
      contributorUserIds: ["user-alex"],
      status: "published",
      folder: "f-nhan-smr",
      daysAgoChanged: 0.5,
    },
    {
      key: "nhan-smr-tube",
      name: "SMR Tube Skin Temperature Profile",
      equipmentId: smrId,
      widgetsKey: "SMR Pigtail Integrity",
      ownerUserId: "user-nhan",
      status: "created",
      folder: "f-nhan-smr",
      daysAgoChanged: 2,
    },
    {
      key: "nhan-coker-demo",
      name: "Coker 01 — Demo Engineer Dashboard",
      equipmentId: cokerId,
      widgetsKey: "Demo Engineer Team's Dashboard",
      ownerUserId: "user-nhan",
      status: "created",
      folder: null,
      daysAgoChanged: 5,
    },
    {
      key: "nhan-coker-process",
      name: "Coker 01 — Process Health (legacy)",
      equipmentId: cokerId,
      widgetsKey: "Process",
      ownerUserId: "user-nhan",
      status: "created",
      folder: "f-nhan-archive",
      daysAgoChanged: 24,
    },

    // ── Legacy tab mirrors — one published entry per equipment.tabs slot ──────
    // These ensure Equipment Home has visual parity after removing dashboardCards.
    {
      key: "legacy-coker-demo",
      name: "Demo Engineer Team's Dashboard",
      equipmentId: cokerId,
      widgetsKey: "Demo Engineer Team's Dashboard",
      ownerUserId: "user-nhan",
      status: "published",
      folder: null,
      daysAgoChanged: 30,
    },
    {
      key: "legacy-coker-proc",
      name: "Process",
      equipmentId: cokerId,
      widgetsKey: "Process",
      ownerUserId: "user-nhan",
      status: "published",
      folder: null,
      daysAgoChanged: 30,
    },
    {
      key: "legacy-coker-fat",
      name: "Fatigue",
      equipmentId: cokerId,
      widgetsKey: "Fatigue",
      ownerUserId: "user-nhan",
      status: "published",
      folder: null,
      daysAgoChanged: 30,
    },
    {
      key: "legacy-coker-bul",
      name: "Bulging",
      equipmentId: cokerId,
      widgetsKey: "Bulging",
      ownerUserId: "user-nhan",
      status: "published",
      folder: null,
      daysAgoChanged: 30,
    },
    {
      key: "legacy-hcu-rea",
      name: "Reactor Health",
      equipmentId: hcuId,
      widgetsKey: "Reactor Health",
      ownerUserId: "user-ben",
      status: "published",
      folder: null,
      daysAgoChanged: 30,
    },
    {
      key: "legacy-hcu-proc",
      name: "Process Control",
      equipmentId: hcuId,
      widgetsKey: "Process Control",
      ownerUserId: "user-ben",
      status: "published",
      folder: null,
      daysAgoChanged: 30,
    },
    {
      key: "legacy-hcu-maint",
      name: "Maintenance",
      equipmentId: hcuId,
      widgetsKey: "Maintenance",
      ownerUserId: "user-ben",
      status: "published",
      folder: null,
      daysAgoChanged: 30,
    },

    // ── Other users own these; some are shared with Nhan ──
    {
      key: "ben-hcu-over",
      name: "HCU 01 — Reactor Overview",
      equipmentId: hcuId,
      widgetsKey: "Overview",
      ownerUserId: "user-ben",
      contributorUserIds: ["user-alex"],
      status: "published",
      folder: "f-ben-hcu",
      daysAgoChanged: 1.5,
    },
    {
      key: "ben-hcu-rea",
      name: "HCU 01 — Reactor Health Live",
      equipmentId: hcuId,
      widgetsKey: "Reactor Health",
      ownerUserId: "user-ben",
      status: "created",
      folder: "f-ben-hcu",
      daysAgoChanged: 4,
    },
    {
      key: "alex-smr-deep",
      name: "SMR — Pigtail Stress Deep-Dive",
      equipmentId: smrId,
      widgetsKey: "SMR Pigtail Integrity",
      ownerUserId: "user-alex",
      status: "created",
      folder: "f-alex-shared-smr",
      daysAgoChanged: 8,
    },
    {
      key: "simon-coker-maint",
      name: "Coker 01 — Maintenance Plan",
      equipmentId: cokerId,
      widgetsKey: "Maintenance",
      ownerUserId: "user-simon",
      status: "published",
      folder: null,
      daysAgoChanged: 12,
    },
    {
      key: "priya-hcu-proc",
      name: "HCU 01 — Process Control Tuning",
      equipmentId: hcuId,
      widgetsKey: "Process Control",
      ownerUserId: "user-priya",
      status: "created",
      folder: null,
      daysAgoChanged: 2,
    },
  ]

  for (const d of dashSkels) {
    const widgets = DEFAULT_GRIDS[d.widgetsKey] ?? DEFAULT_GRIDS["Demo Engineer Team's Dashboard"]
    const id = `dash-${d.key}`
    const lastChange = D(d.daysAgoChanged * 24)
    dashboards.push({
      id,
      equipmentId: d.equipmentId,
      name: d.name,
      lifecycleStatus: d.status,
      ownerUserId: d.ownerUserId,
      contributorUserIds: d.contributorUserIds ?? [],
      folderId: d.folder ? `folder-${d.folder}` : null,
      sourceDashboardId: null,
      thumbnailUrl: generateDashboardThumbnail(id, d.name, widgets),
      lastChangeAt: lastChange,
      lastChangeByUserId: d.contributorUserIds?.[0] ?? d.ownerUserId,
      publishedAt: d.status === "published" ? D(d.daysAgoChanged * 24 + 6) : null,
      deletedAt: null,
      widgets,
      createdAt: D(d.daysAgoChanged * 24 + 24),
      updatedAt: lastChange,
    })
  }

  /* ── Shares with the current user (Nhan) ─────────────────────────────────── */
  shares.push({
    id: "share-1",
    dashboardId: "dash-ben-hcu-rea",
    sharedByUserId: "user-ben",
    sharedWithUserId: "user-nhan",
    permission: "edit",
    message: "Nhan, please review the temperature limits and tune if needed.",
    notifyOnFirstView: true,
    firstViewedAt: null,
    revokedAt: null,
    createdAt: D(20),
    updatedAt: D(20),
  })
  shares.push({
    id: "share-2",
    dashboardId: "dash-alex-smr-deep",
    sharedByUserId: "user-alex",
    sharedWithUserId: "user-nhan",
    permission: "comment",
    message: "Sharing my pigtail stress investigation. Thoughts on the spike on Mar 14?",
    notifyOnFirstView: false,
    firstViewedAt: D(48),
    revokedAt: null,
    createdAt: D(72),
    updatedAt: D(48),
  })
  shares.push({
    id: "share-3",
    dashboardId: "dash-priya-hcu-proc",
    sharedByUserId: "user-priya",
    sharedWithUserId: "user-nhan",
    permission: "view",
    message: null,
    notifyOnFirstView: false,
    firstViewedAt: null,
    revokedAt: null,
    createdAt: D(50),
    updatedAt: D(50),
  })

  /* ── Shares Nhan made to others (outgoing) ───────────────────────────────── */
  shares.push({
    id: "share-4",
    dashboardId: "dash-nhan-coker-mon",
    sharedByUserId: "user-nhan",
    sharedWithUserId: "user-ben",
    permission: "edit",
    message: "Ben, you have edit on the live monitoring dashboard.",
    notifyOnFirstView: true,
    firstViewedAt: D(18),
    revokedAt: null,
    createdAt: D(96),
    updatedAt: D(18),
  })
  shares.push({
    id: "share-5",
    dashboardId: "dash-nhan-smr-pig",
    sharedByUserId: "user-nhan",
    sharedWithUserId: "user-alex",
    permission: "edit",
    message: null,
    notifyOnFirstView: false,
    firstViewedAt: D(10),
    revokedAt: null,
    createdAt: D(120),
    updatedAt: D(10),
  })
  shares.push({
    id: "share-6",
    dashboardId: "dash-nhan-coker-cra",
    sharedByUserId: "user-nhan",
    sharedWithUserId: "user-simon",
    permission: "comment",
    message: "Simon, please leave a comment on the new flaw region.",
    notifyOnFirstView: false,
    firstViewedAt: null,
    revokedAt: null,
    createdAt: D(40),
    updatedAt: D(40),
  })

  /* ── A share link Nhan generated ─────────────────────────────────────────── */
  shareLinks.push({
    id: "link-1",
    dashboardId: "dash-nhan-smr-pig",
    createdByUserId: "user-nhan",
    token: "smrpig-vw-9k3a2",
    permission: "view",
    revokedAt: null,
    createdAt: D(80),
    updatedAt: D(80),
  })

  /* ── Comments ────────────────────────────────────────────────────────────── */
  comments.push({
    id: "cmt-1",
    dashboardId: "dash-alex-smr-deep",
    authorUserId: "user-alex",
    body: "Spike on Mar 14 correlates with the upstream temperature excursion — see annotated chart.",
    createdAt: D(60),
    updatedAt: D(60),
  })
  comments.push({
    id: "cmt-2",
    dashboardId: "dash-alex-smr-deep",
    authorUserId: "user-nhan",
    body: "Agree — should we run a what-if at +5°C inlet?",
    createdAt: D(58),
    updatedAt: D(58),
  })
  comments.push({
    id: "cmt-3",
    dashboardId: "dash-nhan-smr-pig",
    authorUserId: "user-alex",
    body: "Good integrity summary. Suggest adding a tube creep KPI.",
    createdAt: D(36),
    updatedAt: D(36),
  })

  /* ── A pending permission request from Nhan to Priya on a view-only share ── */
  permissionRequests.push({
    id: "req-1",
    dashboardId: "dash-priya-hcu-proc",
    requestedByUserId: "user-nhan",
    requestedToUserId: "user-priya",
    requestedPermission: "comment",
    status: "pending",
    resolvedAt: null,
    message: "I'd like to leave notes on the tuning section.",
    createdAt: D(6),
    updatedAt: D(6),
  })

  /* ── Notifications for the current user (Nhan) ───────────────────────────── */
  notifications.push({
    id: "notif-1",
    userId: "user-nhan",
    category: "dashboard_shared_with_you",
    dashboardId: "dash-ben-hcu-rea",
    relatedShareId: "share-1",
    relatedRequestId: null,
    actorUserId: "user-ben",
    title: "Ben Tran shared 'HCU 01 — Reactor Health Live' with you",
    body: "Permission: edit · \"Nhan, please review the temperature limits and tune if needed.\"",
    readAt: null,
    createdAt: D(20),
    updatedAt: D(20),
  })
  notifications.push({
    id: "notif-2",
    userId: "user-nhan",
    category: "dashboard_first_view",
    dashboardId: "dash-nhan-coker-mon",
    relatedShareId: "share-4",
    relatedRequestId: null,
    actorUserId: "user-ben",
    title: "Ben Tran viewed 'Coker 01 — Live Monitoring' for the first time",
    body: null,
    readAt: D(18),
    createdAt: D(18),
    updatedAt: D(18),
  })
  notifications.push({
    id: "notif-3",
    userId: "user-nhan",
    category: "dashboard_shared_with_you",
    dashboardId: "dash-priya-hcu-proc",
    relatedShareId: "share-3",
    relatedRequestId: null,
    actorUserId: "user-priya",
    title: "Priya Shah shared 'HCU 01 — Process Control Tuning' with you",
    body: "Permission: view",
    readAt: null,
    createdAt: D(50),
    updatedAt: D(50),
  })

  // Notification on the Priya side (request received) — visible if user-switched.
  notifications.push({
    id: "notif-4",
    userId: "user-priya",
    category: "permission_request_received",
    dashboardId: "dash-priya-hcu-proc",
    relatedShareId: null,
    relatedRequestId: "req-1",
    actorUserId: "user-nhan",
    title: "Nhan Nguyen requested comment access on 'HCU 01 — Process Control Tuning'",
    body: "I'd like to leave notes on the tuning section.",
    readAt: null,
    createdAt: D(6),
    updatedAt: D(6),
  })

  return {
    folders,
    dashboards,
    shares,
    shareLinks,
    comments,
    permissionRequests,
    notifications,
  }
}

export const WORKSPACE_SEED: SeedResult = buildWorkspaceSeed()
