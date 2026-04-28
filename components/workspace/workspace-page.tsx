"use client"

import { useEffect, useMemo, useState } from "react"
import { useShallow } from "zustand/react/shallow"
import { useRouter } from "next/navigation"
import { Inbox, Clock, Trash2, Folder as FolderIcon, Home as HomeIcon, FolderOpen as FolderOpenIcon } from "lucide-react"
import { WorkspaceToolbar } from "./workspace-toolbar"
import { DashboardCard } from "./dashboard-card"
import { CreateDashboardDialog } from "./create-dashboard-dialog"
import { ShareDialog } from "./share-dialog"
import { DashboardPopup } from "./dashboard-popup"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import {
  useWorkspaceStore,
} from "@/lib/workspace/store"
import type { WorkspaceState } from "@/lib/workspace/store"
import type {
  DashboardShare,
  WorkspaceDashboard,
  WorkspaceVirtualLocation,
} from "@/lib/workspace/types"
import { getCurrentUserId } from "@/lib/workspace/identity"

export interface WorkspacePageProps {
  /** Which virtual location is active (or "folder" when a specific folder is selected). */
  initial:
    | { kind: "virtual"; location: WorkspaceVirtualLocation }
    | { kind: "folder"; folderId: string }
}

const VIRTUAL_TITLES: Record<WorkspaceVirtualLocation, { title: string; subtitle: string; icon: React.ReactNode }> = {
  all: {
    title: "All dashboards",
    subtitle: "Every dashboard you own.",
    icon: <HomeIcon className="w-5 h-5" />,
  },
  shared: {
    title: "Shared with me",
    subtitle: "Dashboards others have shared with you.",
    icon: <Inbox className="w-5 h-5" />,
  },
  recent: {
    title: "Recent",
    subtitle: "Dashboards you opened recently.",
    icon: <Clock className="w-5 h-5" />,
  },
  trash: {
    title: "Trash",
    subtitle: "Soft-deleted dashboards. Restore or permanently delete.",
    icon: <Trash2 className="w-5 h-5" />,
  },
}

export function WorkspacePage({ initial }: WorkspacePageProps) {
  const router = useRouter()
  const setActiveModule = useAppStore((s) => s.setActiveModule)

  // Set the rail's active module to "workspace" while we're here.
  useEffect(() => {
    setActiveModule("workspace")
  }, [setActiveModule])

  const [selected, setSelected] = useState(initial)
  useEffect(() => {
    setSelected(initial)
  }, [initial])

  // Pre-applied equipment filter (set by Equipment Home → Workspace deep link).
  const initialEquipmentFilter = useWorkspaceStore((s) => s.initialEquipmentFilter)
  const setInitialEquipmentFilter = useWorkspaceStore((s) => s.setInitialEquipmentFilter)
  const setFilter = useWorkspaceStore((s) => s.setFilter)
  useEffect(() => {
    if (initialEquipmentFilter) {
      setFilter("equipmentId", initialEquipmentFilter)
      setInitialEquipmentFilter(null)
    }
  }, [initialEquipmentFilter, setFilter, setInitialEquipmentFilter])

  /* ── Raw store subscriptions ──────────────────────────────────────────── */
  // useShallow prevents infinite re-renders: selectors that return arrays
  // would otherwise produce a new reference every call, causing
  // useSyncExternalStore to think the snapshot changed on every render.
  const {
    rawDashboards,
    rawShares,
    rawFolders,
    recentIds,
    searchQuery,
    filters,
    sortKey,
    sortDir,
    moveDashboard,
  } = useWorkspaceStore(
    useShallow((s: WorkspaceState) => ({
      rawDashboards: s.dashboards,
      rawShares: s.shares,
      rawFolders: s.folders,
      recentIds: s.recentDashboardIds,
      searchQuery: s.searchQuery,
      filters: s.filters,
      sortKey: s.sortKey,
      sortDir: s.sortDir,
      moveDashboard: s.moveDashboard,
    }))
  )

  /* ── Derived data (computed here to avoid unstable selector references) ─ */
  const me = getCurrentUserId()

  const allActive = useMemo(
    () => rawDashboards.filter((d) => !d.deletedAt),
    [rawDashboards]
  )

  const sharedWithMe = useMemo(() => {
    const out: Array<{ dashboard: WorkspaceDashboard; share: DashboardShare }> = []
    for (const sh of rawShares) {
      if (sh.sharedWithUserId !== me) continue
      if (sh.revokedAt) continue
      const dash = rawDashboards.find((d) => d.id === sh.dashboardId && !d.deletedAt)
      if (!dash) continue
      out.push({ dashboard: dash, share: sh })
    }
    return out
  }, [rawDashboards, rawShares, me])

  const trash = useMemo(() => {
    const TRASH_TTL_MS = 30 * 24 * 3_600_000
    const cutoff = Date.now() - TRASH_TTL_MS
    return rawDashboards.filter(
      (d) =>
        d.ownerUserId === me &&
        d.deletedAt !== null &&
        new Date(d.deletedAt!).getTime() >= cutoff
    )
  }, [rawDashboards, me])

  const folders = useMemo(
    () => rawFolders.filter((f) => f.ownerUserId === me),
    [rawFolders, me]
  )

  /* ── Compute card list ────────────────────────────────────────────────── */
  const sourceList: WorkspaceDashboard[] = useMemo(() => {
    if (selected.kind === "folder") {
      return allActive.filter(
        (d) => d.ownerUserId === me && d.folderId === selected.folderId
      )
    }
    switch (selected.location) {
      case "all":
        return allActive.filter((d) => d.ownerUserId === me)
      case "shared":
        return sharedWithMe.map((x) => x.dashboard)
      case "recent": {
        const set = new Set(recentIds)
        const visible = allActive.filter((d) => set.has(d.id))
        // Order by recency
        const order = new Map(recentIds.map((id, i) => [id, i]))
        return visible.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      }
      case "trash":
        return trash
    }
  }, [selected, allActive, sharedWithMe, trash, recentIds, me])

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let out = sourceList.filter((d) => {
      if (q && !d.name.toLowerCase().includes(q)) return false
      if (filters.equipmentId && d.equipmentId !== filters.equipmentId) return false
      if (filters.status && d.lifecycleStatus !== filters.status) return false
      if (filters.creatorUserId && d.ownerUserId !== filters.creatorUserId) return false
      if (
        filters.contributorUserId &&
        !d.contributorUserIds.includes(filters.contributorUserId)
      )
        return false
      if (filters.changedFrom) {
        if (new Date(d.lastChangeAt) < new Date(filters.changedFrom)) return false
      }
      if (filters.changedTo) {
        if (new Date(d.lastChangeAt) > new Date(filters.changedTo + "T23:59:59")) return false
      }
      return true
    })
    out = out.slice().sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name) * dir
        case "lastChange":
          return (new Date(a.lastChangeAt).getTime() - new Date(b.lastChangeAt).getTime()) * dir
        case "created":
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
        case "equipment":
          return a.equipmentId.localeCompare(b.equipmentId) * dir
      }
    })
    return out
  }, [sourceList, searchQuery, filters, sortKey, sortDir])

  /* ── Title + breadcrumb ────────────────────────────────────────────────── */
  const { title, subtitle, breadcrumb } = useMemo(() => {
    if (selected.kind === "folder") {
      const folder = folders.find((f) => f.id === selected.folderId)
      const chain: Array<{ label: string; onClick?: () => void }> = []
      chain.push({
        label: "All dashboards",
        onClick: () => setSelected({ kind: "virtual", location: "all" }),
      })
      // Walk parents
      const ancestry: typeof folders = []
      let cur = folder
      while (cur) {
        ancestry.unshift(cur)
        cur = cur.parentFolderId ? folders.find((f) => f.id === cur!.parentFolderId) : undefined
      }
      for (let i = 0; i < ancestry.length - 1; i++) {
        const f = ancestry[i]
        chain.push({
          label: f.name,
          onClick: () => setSelected({ kind: "folder", folderId: f.id }),
        })
      }
      return {
        title: folder?.name ?? "Folder",
        subtitle: undefined as string | undefined,
        breadcrumb: chain,
      }
    }
    const v = VIRTUAL_TITLES[selected.location]
    return {
      title: v.title,
      subtitle: v.subtitle,
      breadcrumb: undefined as Array<{ label: string; onClick?: () => void }> | undefined,
    }
  }, [selected, folders])

  /* ── Modal state ──────────────────────────────────────────────────────── */
  const [createOpen, setCreateOpen] = useState(false)
  const [shareDashboardId, setShareDashboardId] = useState<string | null>(null)
  const [popupDashboardId, setPopupDashboardId] = useState<string | null>(null)

  const shareDashboard =
    shareDashboardId && allActive.find((d) => d.id === shareDashboardId)

  const isTrash = selected.kind === "virtual" && selected.location === "trash"
  const isShared = selected.kind === "virtual" && selected.location === "shared"

  return (
    <div className="flex-1 min-w-0 flex bg-background">
      <div className="flex-1 min-w-0 flex flex-col">
        <WorkspaceToolbar
          title={title}
          subtitle={subtitle}
          breadcrumb={breadcrumb}
          hideNew={isTrash || isShared}
          onCreateDashboard={() => setCreateOpen(true)}
        />
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          {filteredAndSorted.length === 0 ? (
            <EmptyState
              location={selected}
              onCreate={() => setCreateOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAndSorted.map((d) => {
                const sharedRecord =
                  isShared && sharedWithMe.find((x) => x.dashboard.id === d.id)
                return (
                  <DashboardCard
                    key={d.id}
                    dashboard={d}
                    onOpen={() => setPopupDashboardId(d.id)}
                    onEdit={() => router.push(`/workspace/dashboard/${d.id}/edit`)}
                    onShare={() => setShareDashboardId(d.id)}
                    onMoveTo={
                      isShared || isTrash
                        ? undefined
                        : (folderId) => moveDashboard(d.id, folderId)
                    }
                    variant={isTrash ? "trash" : "default"}
                    badgeOverride={
                      sharedRecord
                        ? `Shared (${sharedRecord.share.permission})`
                        : undefined
                    }
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateDashboardDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultEquipmentId={filters.equipmentId || undefined}
        defaultFolderId={selected.kind === "folder" ? selected.folderId : null}
      />
      <ShareDialog
        dashboard={shareDashboard || null}
        open={!!shareDashboardId}
        onOpenChange={(o) => !o && setShareDashboardId(null)}
      />
      <DashboardPopup
        dashboardId={popupDashboardId}
        open={!!popupDashboardId}
        onClose={() => setPopupDashboardId(null)}
      />
    </div>
  )
}

/* ─── Empty states ─────────────────────────────────────────────────────────── */
function EmptyState({
  location,
  onCreate,
}: {
  location: WorkspacePageProps["initial"]
  onCreate: () => void
}) {
  let icon: React.ReactNode = <FolderOpenIcon className="w-10 h-10 text-muted-foreground/60" />
  let title = "No dashboards"
  let body = ""
  let primary: React.ReactNode = null

  if (location.kind === "folder") {
    title = "This folder is empty"
    body = "Drag dashboards here from another folder, or create a new one."
    primary = <Button onClick={onCreate}>Create dashboard</Button>
  } else {
    switch (location.location) {
      case "all":
        title = "No dashboards yet"
        body = "Create your first Workspace dashboard."
        primary = <Button onClick={onCreate}>Create dashboard</Button>
        break
      case "shared":
        icon = <Inbox className="w-10 h-10 text-muted-foreground/60" />
        title = "Nothing shared with you"
        body = "Dashboards shared with you will appear here."
        break
      case "recent":
        icon = <Clock className="w-10 h-10 text-muted-foreground/60" />
        title = "No recent activity"
        body = "Dashboards you open will appear here."
        break
      case "trash":
        icon = <Trash2 className="w-10 h-10 text-muted-foreground/60" />
        title = "Trash is empty"
        body = "Deleted dashboards stay here for 30 days before being permanently removed."
        break
    }
  }
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-sm space-y-3">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
          {icon}
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{body}</p>
        </div>
        {primary}
      </div>
    </div>
  )
}

void FolderIcon
