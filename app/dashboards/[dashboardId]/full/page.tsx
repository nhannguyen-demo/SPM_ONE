"use client"

import { useParams } from "next/navigation"
import { useEffect } from "react"
import { Eye, ExternalLink } from "lucide-react"
import { useWorkspaceStore } from "@/lib/workspace/store"
import { ResponsiveDashboardGrid } from "@/components/workspace/read-only-grid"
import { useRegisterViewerTab } from "@/lib/workspace/use-viewer-tabs"
import { getCurrentUserId, findOrgUserById } from "@/lib/workspace/identity"
import { sites } from "@/lib/data"

function equipmentName(equipmentId: string): string {
  for (const s of sites)
    for (const p of s.units)
      for (const e of p.equipment) if (e.id === equipmentId) return e.name
  return ""
}

/**
 * Chromeless, full-bleed Workspace dashboard viewer. Renders the dashboard
 * full-screen and registers this tab via cross-tab signalling so the
 * Equipment Home Page shows its "open elsewhere" indicator.
 */
export default function FullScreenDashboardViewerPage() {
  const params = useParams<{ dashboardId: string }>()
  const dashboardId = (params?.dashboardId as string) ?? ""

  const dashboard = useWorkspaceStore((s) =>
    s.dashboards.find((d) => d.id === dashboardId) ?? null
  )
  const recordOpened = useWorkspaceStore((s) => s.recordDashboardOpened)
  useEffect(() => {
    if (dashboard) recordOpened(dashboard.id)
    if (typeof document !== "undefined" && dashboard) {
      document.title = `${dashboard.name} · SPM ONE`
    }
  }, [dashboard, recordOpened])

  const me = getCurrentUserId()
  useRegisterViewerTab(dashboardId, me)

  if (!dashboard) {
    return (
      <div className="h-screen w-screen flex items-center justify-center text-muted-foreground">
        Dashboard not found.
      </div>
    )
  }

  const owner = findOrgUserById(dashboard.ownerUserId)

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Slim, dismissible header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground truncate">
              {equipmentName(dashboard.equipmentId)} · Owner:{" "}
              {owner?.name ?? "Unknown"} ·{" "}
              {dashboard.lifecycleStatus === "published" ? "Published" : "Draft"}
            </div>
            <h1 className="text-sm font-bold text-foreground truncate">
              {dashboard.name}
            </h1>
          </div>
        </div>
        <a
          href="/workspace"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          Open in Workspace <ExternalLink className="w-3 h-3" />
        </a>
      </header>
      <main className="flex-1 min-h-0 overflow-auto bg-muted/20">
        <ResponsiveDashboardGrid dashboard={dashboard} />
      </main>
    </div>
  )
}
